"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ReportLegend, ReportViewer } from "@/components/ReportViewer";
import { ScoreDashboard } from "@/components/ScoreDashboard";
import { SummarySidebar } from "@/components/SummarySidebar";
import { placeholderReport } from "@/lib/mock-report";
import type { AnalysisReport } from "@/types/analysis";

const ANALYSIS_REPORT_STORAGE_KEY = "resumatch:last-analysis-report";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredAnalysisReport(value: unknown): value is AnalysisReport {
  return (
    isPlainObject(value) &&
    typeof value.score === "number" &&
    typeof value.summary === "string" &&
    Array.isArray(value.jobDirection) &&
    isStringArray(value.matchedKeywords) &&
    isStringArray(value.missingKeywords) &&
    Array.isArray(value.suggestions) &&
    Array.isArray(value.history) &&
    Array.isArray(value.segments)
  );
}

function readStoredReport(): AnalysisReport | null {
  try {
    const rawReport = sessionStorage.getItem(ANALYSIS_REPORT_STORAGE_KEY);

    if (!rawReport) {
      return null;
    }

    const parsedReport: unknown = JSON.parse(rawReport);

    return isStoredAnalysisReport(parsedReport) ? parsedReport : null;
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const [report, setReport] = useState<AnalysisReport>(placeholderReport);
  const [isSessionReport, setIsSessionReport] = useState(false);

  useEffect(() => {
    const storedReport = readStoredReport();

    if (storedReport) {
      setReport(storedReport);
      setIsSessionReport(true);
    }
  }, []);

  return (
    <main
      className="min-h-screen bg-white text-ink lg:flex"
      data-report-source={isSessionReport ? "session" : "mock"}
    >
      <HistorySidebar history={report.history} />

      <div className="min-w-0 flex-1 bg-white">
        <header className="flex flex-col gap-4 border-b border-line bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              分析报告
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ink">
              简历匹配分析报告
            </h1>
          </div>
          <Link
            className="inline-flex w-fit items-center justify-center rounded-[12px] border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
            href="/"
          >
            + 新建分析
          </Link>
        </header>

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px] space-y-4">
            <ScoreDashboard report={report} />
            <ReportLegend />

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
              <div className="min-w-0 space-y-4">
                <ReportViewer segments={report.segments} />
                <p className="px-1 text-xs leading-5 text-slate-400">
                  {isSessionReport
                    ? "本报告由 AI 根据本次上传内容生成，仅供参考，建议结合自身实际情况判断。"
                    : "本报告为 AI 辅助分析占位展示，仅供参考，建议结合自身实际情况判断。"}
                </p>
              </div>

              <SummarySidebar report={report} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
