import { NextResponse } from "next/server";

import {
  validateAnalysisReport,
  validateAnalyzeRequest
} from "@/lib/analysis-schema";
import { analyzeWithDeepSeek, DeepSeekClientError } from "@/lib/deepseek-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const requestValidation = validateAnalyzeRequest(payload);

  if (!requestValidation.ok) {
    return NextResponse.json({ error: requestValidation.error }, { status: 400 });
  }

  try {
    const analysisReport = await analyzeWithDeepSeek(requestValidation.data);

    const reportValidation = validateAnalysisReport(analysisReport);

    if (!reportValidation.ok) {
      return NextResponse.json(
        { error: `AI 分析结果结构校验失败：${reportValidation.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json(reportValidation.data);
  } catch (error) {
    if (error instanceof DeepSeekClientError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "AI 分析服务暂时不可用，请稍后再试。" },
      { status: 500 }
    );
  }
}
