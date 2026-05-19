import type { AnalyzeRequest } from "@/lib/analysis-schema";
import { validateAnalysisReport } from "@/lib/analysis-schema";
import { analysisSystemPrompt, buildAnalysisUserPrompt } from "@/lib/analysis-prompt";
import {
  filterUnmatchedSegments,
  locateResumeAnnotations,
  validateSegmentOriginals,
  type SegmentOriginalIssue
} from "@/lib/segment-original-validator";
import type { AnalysisReport } from "@/types/analysis";

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
    };
  }>;
};

type ParsedModelJson = {
  parsed: unknown;
};

type ModelReportObject = Record<string, unknown>;

export type DeepSeekConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

export type DeepSeekClientEnv = {
  [key: string]: string | undefined;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_API_BASE_URL?: string;
};

export type DeepSeekFetch = typeof fetch;

export class DeepSeekClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "DeepSeekClientError";
  }
}

function getContentDiagnostics(content: string | null | undefined): {
  contentLength: number;
  isEmpty: boolean;
  startsLikeJson: boolean;
  endsLikeJson: boolean;
} {
  const trimmedContent = content?.trim() ?? "";

  return {
    contentLength: content?.length ?? 0,
    isEmpty: trimmedContent.length === 0,
    startsLikeJson: trimmedContent.startsWith("{") || trimmedContent.startsWith("```"),
    endsLikeJson: trimmedContent.endsWith("}") || trimmedContent.endsWith("```")
  };
}

function getDeepSeekConfig(env: DeepSeekClientEnv): DeepSeekConfig {
  const apiKey = env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new DeepSeekClientError("AI 分析服务尚未配置，请稍后再试。", 500);
  }

  return {
    apiKey,
    model: env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash",
    baseUrl: (env.DEEPSEEK_API_BASE_URL?.trim() || "https://api.deepseek.com").replace(
      /\/+$/,
      ""
    )
  };
}

function buildMessages(
  request: AnalyzeRequest,
  originalIssues: SegmentOriginalIssue[] = [],
  jsonRepairReason: string | null = null
): DeepSeekMessage[] {
  return [
    { role: "system", content: analysisSystemPrompt },
    { role: "user", content: buildAnalysisUserPrompt(request, originalIssues, jsonRepairReason) }
  ];
}

function getJsonCandidate(content: string): string {
  const trimmedContent = content.trim();
  const fenceMatch = trimmedContent.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const unwrappedContent = fenceMatch ? fenceMatch[1].trim() : trimmedContent;

  if (unwrappedContent.startsWith("{") && unwrappedContent.endsWith("}")) {
    return unwrappedContent;
  }

  const firstBraceIndex = unwrappedContent.indexOf("{");
  const lastBraceIndex = unwrappedContent.lastIndexOf("}");

  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    return unwrappedContent.slice(firstBraceIndex, lastBraceIndex + 1);
  }

  return unwrappedContent;
}

function parseModelJson(content: string): ParsedModelJson {
  const jsonCandidate = getJsonCandidate(content);

  try {
    return {
      parsed: JSON.parse(jsonCandidate)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知 JSON 解析错误";
    const diagnostics = getContentDiagnostics(content);

    throw new Error(
      `DeepSeek 返回结果不是合法 JSON。parse error: ${message}. content_length: ${diagnostics.contentLength}. is_empty: ${diagnostics.isEmpty}. starts_like_json: ${diagnostics.startsLikeJson}. ends_like_json: ${diagnostics.endsLikeJson}.`
    );
  }
}

function isModelReportObject(value: unknown): value is ModelReportObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withServerResumeOriginal(payload: unknown, resumeText: string): unknown {
  if (!isModelReportObject(payload)) {
    return payload;
  }

  return {
    ...payload,
    resumeOriginal: resumeText
  };
}

function parseDeepSeekContent(
  responseBody: DeepSeekChatCompletionResponse
): unknown {
  const choice = responseBody.choices?.[0];
  const finishReason = choice?.finish_reason;
  const content = choice?.message?.content;

  if (finishReason === "length") {
    throw new DeepSeekClientError(
      "DeepSeek 输出被截断，请提高 max_tokens 或缩短输入内容。",
      500
    );
  }

  if (
    finishReason &&
    !["stop", "content_filter", "tool_calls", "insufficient_system_resource"].includes(
      finishReason
    )
  ) {
    throw new DeepSeekClientError("AI 分析服务返回异常，请稍后重试。", 500);
  }

  if (finishReason && finishReason !== "stop") {
    throw new DeepSeekClientError("AI 分析服务返回异常，请稍后重试。", 500);
  }

  if (!content) {
    throw new Error("DeepSeek 返回内容为空。");
  }

  return parseModelJson(content).parsed;
}

async function requestDeepSeekAnalysis(
  request: AnalyzeRequest,
  config: DeepSeekConfig,
  fetcher: DeepSeekFetch,
  originalIssues: SegmentOriginalIssue[],
  jsonRepairReason: string | null
): Promise<unknown> {
  const requestBody = {
    model: config.model,
    messages: buildMessages(request, originalIssues, jsonRepairReason),
    max_tokens: 4096,
    response_format: { type: "json_object" as const },
    stream: false,
    temperature: 0.2
  };

  const response = await fetcher(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new DeepSeekClientError("AI 分析服务暂时不可用，请稍后再试。", 502);
  }

  return parseDeepSeekContent((await response.json()) as DeepSeekChatCompletionResponse);
}

export async function analyzeWithDeepSeek(
  request: AnalyzeRequest,
  options: {
    env?: DeepSeekClientEnv;
    fetcher?: DeepSeekFetch;
  } = {}
): Promise<AnalysisReport> {
  const config = getDeepSeekConfig(options.env ?? process.env);
  const fetcher = options.fetcher ?? fetch;
  let lastValidationError = "DeepSeek 返回结果不是有效的分析 JSON。";
  let originalIssues: SegmentOriginalIssue[] = [];
  let jsonRepairReason: string | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parsedPayload = await requestDeepSeekAnalysis(
        request,
        config,
        fetcher,
        originalIssues,
        jsonRepairReason
      );
      const validation = validateAnalysisReport(
        withServerResumeOriginal(parsedPayload, request.resumeText)
      );

      if (!validation.ok) {
        lastValidationError = validation.error;
        jsonRepairReason = validation.error;
        continue;
      }

      const originalValidation = validateSegmentOriginals(validation.data, request.resumeText);

      const annotationValidation = locateResumeAnnotations(
        validation.data,
        request.resumeText
      );

      if (originalValidation.ok && annotationValidation.ok) {
        return annotationValidation.report;
      }

      if (!originalValidation.ok) {
        lastValidationError = "存在未命中简历原文的 segments.original。";
        originalIssues = originalValidation.issues;
        jsonRepairReason = null;
      } else {
        lastValidationError = "存在未命中简历原文的 annotations.original。";
        originalIssues = [];
        jsonRepairReason = lastValidationError;
      }

      if (attempt === 1) {
        const reportWithMatchedSegments = originalValidation.ok
          ? validation.data
          : filterUnmatchedSegments(validation.data, request.resumeText);
        const filteredReport = locateResumeAnnotations(
          reportWithMatchedSegments,
          request.resumeText
        ).report;
        const filteredValidation = validateAnalysisReport(filteredReport);

        if (filteredValidation.ok) {
          return filteredValidation.data;
        }
      }
    } catch (error) {
      if (error instanceof DeepSeekClientError) {
        throw error;
      }

      const parseErrorSummary =
        error instanceof Error ? error.message : "DeepSeek 返回结果不是合法 JSON。";
      lastValidationError = parseErrorSummary;
      jsonRepairReason = parseErrorSummary;
    }
  }

  throw new DeepSeekClientError(`AI 分析结果结构校验失败：${lastValidationError}`, 500);
}
