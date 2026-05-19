"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ReportLegend, ReportViewer } from "@/components/ReportViewer";
import { ScoreDashboard } from "@/components/ScoreDashboard";
import { SummarySidebar } from "@/components/SummarySidebar";
import { createMockAnalysisReport } from "@/lib/mock-analysis";
import type {
  AnalysisReport,
  AnnotationStatus,
  ReportSegment,
  ResumeAnnotation,
  SegmentStatus
} from "@/types/analysis";

const ANALYSIS_REPORT_STORAGE_KEY = "resumatch:last-analysis-report";
const annotationStatuses = new Set<AnnotationStatus>(["keep", "improve", "remove"]);
const segmentStatuses = new Set<SegmentStatus>(["relevant", "optimize", "irrelevant"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isReportSegment(value: unknown): value is ReportSegment {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.section === "string" &&
    typeof value.original === "string" &&
    typeof value.status === "string" &&
    segmentStatuses.has(value.status as SegmentStatus) &&
    typeof value.comment === "string" &&
    typeof value.suggestion === "string"
  );
}

function isResumeAnnotation(value: unknown): value is ResumeAnnotation {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.original === "string" &&
    typeof value.status === "string" &&
    annotationStatuses.has(value.status as AnnotationStatus) &&
    typeof value.relatedJdNeed === "string" &&
    typeof value.reason === "string" &&
    typeof value.suggestion === "string" &&
    typeof value.rewriteExample === "string" &&
    (value.section === undefined || typeof value.section === "string") &&
    (value.startIndex === undefined || typeof value.startIndex === "number") &&
    (value.endIndex === undefined || typeof value.endIndex === "number")
  );
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
    Array.isArray(value.segments) &&
    value.segments.every(isReportSegment) &&
    (value.resumeOriginal === undefined || typeof value.resumeOriginal === "string") &&
    (value.annotations === undefined ||
      (Array.isArray(value.annotations) && value.annotations.every(isResumeAnnotation)))
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

function getDisplayableSegments(report: AnalysisReport): ReportSegment[] {
  return report.segments.filter((segment) => segment.original.trim().length > 0);
}

function DetailEmptyState({ report }: { report: AnalysisReport }) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <div className="border-b border-line pb-4">
        <h2 className="text-base font-semibold text-ink">简历原文批改</h2>
        <p className="mt-1 text-sm text-muted">
          当前报告没有可定位的简历原文或批改标注。
        </p>
      </div>

      <p className="mt-5 rounded-[12px] border border-line bg-slate-50/60 p-4 text-sm leading-6 text-slate-600">
        {report.summary ||
          "请重新发起分析，或确认分析结果中包含 resumeOriginal 与 annotations。"}
      </p>
    </section>
  );
}

export default function ResultPage() {
  const [report, setReport] = useState<AnalysisReport>(() => createMockAnalysisReport());
  const [isSessionReport, setIsSessionReport] = useState(false);

  useEffect(() => {
    const storedReport = readStoredReport();

    if (storedReport) {
      setReport(storedReport);
      setIsSessionReport(true);
    }
  }, []);

  const displayableSegments = getDisplayableSegments(report);
  const hasResumeReview = Boolean(report.resumeOriginal?.trim() && report.annotations?.length);
  const hasMainContent = hasResumeReview || displayableSegments.length > 0;

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
                {hasMainContent ? (
                  <ReportViewer
                    annotations={report.annotations}
                    resumeOriginal={report.resumeOriginal}
                    segments={displayableSegments}
                  />
                ) : (
                  <DetailEmptyState report={report} />
                )}
                <p className="px-1 text-xs leading-5 text-slate-400">
                  {isSessionReport
                    ? "本报告由 AI 根据本次上传内容生成，仅供参考，建议结合自身实际情况判断。"
                    : "本报告为示例数据，仅供参考，建议结合自身实际情况判断。"}
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
