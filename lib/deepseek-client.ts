import type { AnalyzeRequest } from "@/lib/analysis-schema";
import {
  validateAnalysisReport,
  validateRequirementChecks,
  validateRubricRatings
} from "@/lib/analysis-schema";
import { analysisSystemPrompt, buildAnalysisUserPrompt } from "@/lib/analysis-prompt";
import {
  filterUnmatchedSegments,
  locateResumeAnnotations,
  validateSegmentOriginals,
  type SegmentOriginalIssue
} from "@/lib/segment-original-validator";
import type {
  AnalysisReport,
  RequirementCheck,
  RubricRatingLevel,
  RubricRatings
} from "@/types/analysis";

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
type ContactInfo = {
  emails: string[];
  phones: string[];
  urls: string[];
  githubs: string[];
};

type RewriteSource = {
  original: string;
  rewriteExample?: string;
};

type RubricDimension = keyof RubricRatings;

const rubricScoreMap: Record<RubricDimension, Record<RubricRatingLevel, number>> = {
  hardSkillMatch: { strong: 25, medium: 18, weak: 9, missing: 0 },
  evidenceStrength: { strong: 25, medium: 18, weak: 9, missing: 0 },
  businessContext: { strong: 20, medium: 14, weak: 7, missing: 0 },
  quantifiedResult: { strong: 15, medium: 10, weak: 4, missing: 0 },
  resumeClarity: { strong: 15, medium: 10, weak: 5, missing: 0 }
};

const juniorRubricScoreMap: Record<RubricDimension, Record<RubricRatingLevel, number>> = {
  hardSkillMatch: rubricScoreMap.hardSkillMatch,
  evidenceStrength: rubricScoreMap.evidenceStrength,
  businessContext: { strong: 20, medium: 16, weak: 11, missing: 0 },
  quantifiedResult: { strong: 15, medium: 12, weak: 8, missing: 0 },
  resumeClarity: rubricScoreMap.resumeClarity
};

function isJuniorRole(jobDescription: string): boolean {
  const jd = jobDescription.toLowerCase();
  const seniorPatterns = /高级|manager|leader|经理/;

  if (seniorPatterns.test(jd)) return false;

  const juniorPatterns = /实习|助理|专员|初级/;

  return juniorPatterns.test(jd);
}

function hasProjectEvidence(resumeText: string): boolean {
  const patterns = /独立开发|项目|API|Next\.js|部署|GitHub|Vercel|产品定义/i;

  return patterns.test(resumeText);
}

function computeEvidenceBonus(resumeText: string, level: RubricRatingLevel): number {
  if (!hasProjectEvidence(resumeText)) return 0;
  if (level === "medium") return 4;
  if (level === "weak") return 7;
  return 0;
}

function calculateRubricScore(rubricRatings: RubricRatings, isJunior = false): number {
  const scoreMap = isJunior ? juniorRubricScoreMap : rubricScoreMap;

  return Object.entries(scoreMap).reduce((total, [dimension, scores]) => {
    const rating = rubricRatings[dimension as RubricDimension];
    return total + scores[rating.level];
  }, 0);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getRequirementCheckAdjustment(check: RequirementCheck): number {
  if (check.status === "present") {
    if (check.priority === "must") {
      return 2;
    }

    return check.priority === "preferred" ? 1 : 0.5;
  }

  if (check.status === "weak") {
    if (check.priority === "must") {
      return -5;
    }

    return check.priority === "preferred" ? -2 : -1;
  }

  if (check.priority === "must") {
    return -6;
  }

  return check.priority === "preferred" ? -4 : -2;
}

function calculateRequirementCalibratedScore(
  rubricRatings: RubricRatings,
  requirementChecks: RequirementCheck[],
  isJunior = false
): number {
  const rubricScore = calculateRubricScore(rubricRatings, isJunior);
  const rawAdjustment = requirementChecks.reduce(
    (total, check) => total + getRequirementCheckAdjustment(check),
    0
  );
  const adjustment = Math.max(rawAdjustment, -18);
  const hasMissingMust = requirementChecks.some(
    (check) => check.priority === "must" && check.status === "missing"
  );
  const hasPresentMustOrPreferred = requirementChecks.some(
    (check) =>
      (check.priority === "must" || check.priority === "preferred") &&
      check.status === "present" &&
      check.evidence.trim().length > 0
  );
  const calibratedScore = clampScore(rubricScore + adjustment);

  if (!hasMissingMust && hasPresentMustOrPreferred && rubricScore >= 60) {
    return Math.max(calibratedScore, 68);
  }

  return calibratedScore;
}

function normalizeRequirementKeyword(label: string): string {
  const compactLabel = label
    .replace(/[。；;，,：:、/|()[\]{}"'“”‘’<>《》]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstToken = compactLabel.split(" ").find(Boolean) ?? "";

  return Array.from(firstToken).slice(0, 18).join("");
}

function deriveMissingKeywordsFromRequirementChecks(
  requirementChecks: RequirementCheck[]
): string[] {
  return Array.from(
    new Set(
      requirementChecks
        .filter((check) => check.status === "missing" || check.status === "weak")
        .map((check) => normalizeRequirementKeyword(check.label))
        .filter((keyword) => keyword.length > 0)
    )
  ).slice(0, 8);
}

function logRubricScoreFallback(reason: string): void {
  console.info("rubricRatings score fallback", { reason });
}

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

function countWithoutWhitespace(value: string): number {
  return Array.from(value.replace(/\s+/g, "")).length;
}

function normalizeComparable(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function normalizeResumeDisplayWhitespace(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function lightlyCleanResumeText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

function uniqueMatches(value: string, pattern: RegExp): string[] {
  return Array.from(new Set(value.match(pattern) ?? []));
}

function extractContactInfo(value: string): ContactInfo {
  return {
    emails: uniqueMatches(value, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
    phones: uniqueMatches(value, /(?:\+?\d[\d\s().-]{6,}\d)/g).map((phone) =>
      phone.replace(/\D/g, "")
    ),
    urls: uniqueMatches(value, /https?:\/\/[^\s)]+/gi),
    githubs: uniqueMatches(value, /github\.com\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?/gi)
  };
}

function hasContactInfoLoss(original: string, displayText: string): boolean {
  const normalizedDisplay = normalizeComparable(displayText);
  const originalInfo = extractContactInfo(original);

  return (
    originalInfo.emails.some((email) => !normalizedDisplay.includes(normalizeComparable(email))) ||
    originalInfo.phones.some((phone) => !displayText.replace(/\D/g, "").includes(phone)) ||
    originalInfo.urls.some((url) => !normalizedDisplay.includes(normalizeComparable(url))) ||
    originalInfo.githubs.some((github) => !normalizedDisplay.includes(normalizeComparable(github)))
  );
}

const analysisPollutionPattern =
  /以下是整理后的简历|以下是分析结果|这份简历的匹配度|针对该\s*JD|根据岗位要求|建议你修改简历|本报告认为|该候选人|岗位匹配度|JD\s*分析|简历分析报告/gi;

function countPatternMatches(value: string, pattern: RegExp): number {
  return value.match(new RegExp(pattern.source, pattern.flags))?.length ?? 0;
}

function containsNewAnalysisPollution(displayText: string, resumeText: string): boolean {
  const displayMatches = countPatternMatches(displayText, analysisPollutionPattern);

  return displayMatches > countPatternMatches(resumeText, analysisPollutionPattern);
}

function isSafeResumeDisplayText(value: unknown, resumeText: string): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  const originalCharCount = countWithoutWhitespace(resumeText);
  const displayCharCount = countWithoutWhitespace(value);

  if (originalCharCount === 0 || displayCharCount === 0) {
    return false;
  }

  const ratio = displayCharCount / originalCharCount;

  if (ratio < 0.9 || ratio > 1.1) {
    return false;
  }

  if (containsNewAnalysisPollution(value, resumeText)) {
    return false;
  }

  return !hasContactInfoLoss(resumeText, value);
}

function compactClaimText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function extractQuantitativeClaims(value: string): string[] {
  return Array.from(
    new Set(
      value.match(
        /\d+(?:[.,]\d+)?\s*(?:%|％|k|K|w|W|万|千|百|人|位|个|次|小时|分钟|天|周|月|年|倍|名|元|美元|排名)?/g
      ) ?? []
    )
  ).map((claim) => compactClaimText(claim));
}

function hasUnsupportedQuantitativeClaim(rewriteExample: string, sourceText: string): boolean {
  const source = compactClaimText(sourceText);
  return extractQuantitativeClaims(rewriteExample).some((claim) => !source.includes(claim));
}

function sanitizeRewriteExamples(payload: ModelReportObject, resumeDisplayText: string): ModelReportObject {
  if (!Array.isArray(payload.annotations)) {
    return payload;
  }

  return {
    ...payload,
    annotations: payload.annotations.map((annotation) => {
      if (!isModelReportObject(annotation)) {
        return annotation;
      }

      const source: RewriteSource = {
        original: typeof annotation.original === "string" ? annotation.original : "",
        rewriteExample:
          typeof annotation.rewriteExample === "string" ? annotation.rewriteExample : undefined
      };

      if (
        typeof source.rewriteExample !== "string" ||
        !hasUnsupportedQuantitativeClaim(
          source.rewriteExample,
          `${source.original}\n${resumeDisplayText}`
        )
      ) {
        return annotation;
      }

      return {
        ...annotation,
        rewriteExample: "可补充真实数据：如使用人数、效率提升比例、反馈结果等。"
      };
    })
  };
}

function withDeterministicRubricScore(payload: unknown, isJunior = false): unknown {
  if (!isModelReportObject(payload)) {
    return payload;
  }

  if (payload.rubricRatings === undefined) {
    logRubricScoreFallback("missing rubricRatings");
    return payload;
  }

  const rubricValidation = validateRubricRatings(payload.rubricRatings);

  if (!rubricValidation.ok) {
    const payloadWithoutInvalidRubric = { ...payload };
    delete payloadWithoutInvalidRubric.rubricRatings;
    logRubricScoreFallback(rubricValidation.error);
    return payloadWithoutInvalidRubric;
  }

  if (payload.requirementChecks !== undefined) {
    const requirementChecksValidation = validateRequirementChecks(payload.requirementChecks);

    if (!requirementChecksValidation.ok) {
      const payloadWithoutInvalidRequirementChecks = { ...payload };
      delete payloadWithoutInvalidRequirementChecks.requirementChecks;
      logRubricScoreFallback(requirementChecksValidation.error);
      return {
        ...payloadWithoutInvalidRequirementChecks,
        rubricRatings: rubricValidation.data,
        score: calculateRubricScore(rubricValidation.data, isJunior)
      };
    }

    return {
      ...payload,
      rubricRatings: rubricValidation.data,
      requirementChecks: requirementChecksValidation.data,
      missingKeywords: deriveMissingKeywordsFromRequirementChecks(
        requirementChecksValidation.data
      ),
      score: calculateRequirementCalibratedScore(
        rubricValidation.data,
        requirementChecksValidation.data,
        isJunior
      )
    };
  }

  return {
    ...payload,
    rubricRatings: rubricValidation.data,
    score: calculateRubricScore(rubricValidation.data, isJunior)
  };
}

function withServerResumeOriginal(payload: unknown, request: AnalyzeRequest): unknown {
  const isJunior = isJuniorRole(request.jobDescription);
  const scoreNormalizedPayload = withDeterministicRubricScore(payload, isJunior);

  if (!isModelReportObject(scoreNormalizedPayload)) {
    return scoreNormalizedPayload;
  }

  const evidenceBonus =
    isJunior &&
    scoreNormalizedPayload.rubricRatings &&
    typeof scoreNormalizedPayload.score === "number"
      ? computeEvidenceBonus(
          request.resumeText,
          (scoreNormalizedPayload.rubricRatings as RubricRatings).evidenceStrength.level
        )
      : 0;

  const adjustedPayload =
    evidenceBonus > 0
      ? {
          ...scoreNormalizedPayload,
          score: clampScore(scoreNormalizedPayload.score as number + evidenceBonus)
        }
      : scoreNormalizedPayload;

  const isPdfResume = request.resumeFileType === "pdf";
  const adoptedResumeDisplayText = isSafeResumeDisplayText(
    adjustedPayload.resumeDisplayText,
    request.resumeText
  )
    ? adjustedPayload.resumeDisplayText
    : request.resumeText;
  const resumeDisplayText = isPdfResume
    ? normalizeResumeDisplayWhitespace(adoptedResumeDisplayText)
    : lightlyCleanResumeText(adoptedResumeDisplayText);

  return sanitizeRewriteExamples({
    ...adjustedPayload,
    resumeOriginal: request.resumeText,
    resumeDisplayText
  }, resumeDisplayText);
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
    max_tokens: 16384,
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
        withServerResumeOriginal(parsedPayload, request)
      );

      if (!validation.ok) {
        lastValidationError = validation.error;
        jsonRepairReason = validation.error;
        continue;
      }

      const reviewText =
        validation.data.resumeDisplayText || validation.data.resumeOriginal || request.resumeText;
      const originalValidation = validateSegmentOriginals(validation.data, reviewText);

      const annotationValidation = locateResumeAnnotations(
        validation.data,
        reviewText
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
          : filterUnmatchedSegments(validation.data, reviewText);
        const filteredReport = locateResumeAnnotations(
          reportWithMatchedSegments,
          reviewText
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
