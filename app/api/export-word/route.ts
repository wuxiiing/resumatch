import { NextResponse } from "next/server";
import {
  generateAnalysisReportDocx,
  getExportWordHeaders
} from "@/lib/export-word";
import type { AnalysisReport } from "@/types/analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const report = getReportFromPayload(payload);

    if (!report) {
      return NextResponse.json(
        { error: "缺少可导出的分析报告。" },
        { status: 400 }
      );
    }

    const buffer = await generateAnalysisReportDocx(report);
    return new NextResponse(new Uint8Array(buffer), {
      headers: getExportWordHeaders()
    });
  } catch {
    return NextResponse.json(
      { error: "Word 报告导出失败，请稍后重试。" },
      { status: 500 }
    );
  }
}

function getReportFromPayload(payload: unknown): AnalysisReport | null {
  if (!isPlainObject(payload) || !isPlainObject(payload.report)) {
    return null;
  }

  const report = payload.report;

  if (
    typeof report.score !== "number" ||
    typeof report.summary !== "string" ||
    !Array.isArray(report.jobDirection) ||
    !Array.isArray(report.matchedKeywords) ||
    !Array.isArray(report.missingKeywords)
  ) {
    return null;
  }

  return report as AnalysisReport;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
