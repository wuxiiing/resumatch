"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ReportLegend, ReportViewer } from "@/components/ReportViewer";
import { ScoreDashboard } from "@/components/ScoreDashboard";
import {
  ExportReportSection,
  JobDirectionSection,
  KeywordAnalysisSection,
  SummarySidebar
} from "@/components/SummarySidebar";
import type {
  AnalysisReport,
  AnnotationStatus,
  HistoryItem,
  RequirementCheck,
  RequirementCheckPriority,
  RequirementCheckStatus,
  ReportSegment,
  ResumeAnnotation,
  SegmentStatus
} from "@/types/analysis";

const ANALYSIS_REPORT_STORAGE_KEY = "resumatch:last-analysis-report";
const LOCAL_REPORT_HISTORY_STORAGE_KEY = "resumatch:local-report-history";
const MAX_LOCAL_HISTORY_ITEMS = 5;
const annotationStatuses = new Set<AnnotationStatus>(["keep", "improve", "remove"]);
const requirementCheckPriorities = new Set<RequirementCheckPriority>([
  "must",
  "preferred",
  "context"
]);
const requirementCheckStatuses = new Set<RequirementCheckStatus>([
  "present",
  "weak",
  "missing"
]);
const segmentStatuses = new Set<SegmentStatus>(["relevant", "optimize", "irrelevant"]);

type ReportSource = "loading" | "session" | "history" | "empty";

type LocalReportHistoryEntry = {
  createdAt: string;
  description: string;
  id: string;
  report: AnalysisReport;
  score: number;
  title: string;
};

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
    (value.rewriteExample === undefined || typeof value.rewriteExample === "string") &&
    (value.status !== "improve" ||
      (typeof value.rewriteExample === "string" &&
        value.rewriteExample.trim().length > 0)) &&
    (value.section === undefined || typeof value.section === "string") &&
    (value.startIndex === undefined || typeof value.startIndex === "number") &&
    (value.endIndex === undefined || typeof value.endIndex === "number")
  );
}

function isRequirementCheck(value: unknown): value is RequirementCheck {
  return (
    isPlainObject(value) &&
    typeof value.label === "string" &&
    typeof value.priority === "string" &&
    requirementCheckPriorities.has(value.priority as RequirementCheckPriority) &&
    typeof value.status === "string" &&
    requirementCheckStatuses.has(value.status as RequirementCheckStatus) &&
    typeof value.evidence === "string" &&
    typeof value.note === "string"
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
    (value.requirementChecks === undefined ||
      (Array.isArray(value.requirementChecks) &&
        value.requirementChecks.every(isRequirementCheck))) &&
    (value.resumeOriginal === undefined || typeof value.resumeOriginal === "string") &&
    (value.resumeDisplayText === undefined || typeof value.resumeDisplayText === "string") &&
    (value.annotations === undefined ||
      (Array.isArray(value.annotations) && value.annotations.every(isResumeAnnotation)))
  );
}

function isLocalReportHistoryEntry(value: unknown): value is LocalReportHistoryEntry {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.score === "number" &&
    isStoredAnalysisReport(value.report)
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

function readLocalReportHistory(): LocalReportHistoryEntry[] {
  try {
    const rawHistory = localStorage.getItem(LOCAL_REPORT_HISTORY_STORAGE_KEY);

    if (!rawHistory) {
      return [];
    }

    const parsedHistory: unknown = JSON.parse(rawHistory);

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory
      .filter(isLocalReportHistoryEntry)
      .slice(0, MAX_LOCAL_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function writeLocalReportHistory(history: LocalReportHistoryEntry[]) {
  const nextHistory = history.slice(0, MAX_LOCAL_HISTORY_ITEMS);

  if (nextHistory.length === 0) {
    localStorage.removeItem(LOCAL_REPORT_HISTORY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    LOCAL_REPORT_HISTORY_STORAGE_KEY,
    JSON.stringify(nextHistory)
  );
}

function sanitizeReportForHistory(report: AnalysisReport): AnalysisReport {
  return {
    ...report,
    history: []
  };
}

function getHistoryTitle(report: AnalysisReport): string {
  const firstDirection = report.jobDirection[0];
  const firstKeyword = report.matchedKeywords[0] || report.missingKeywords[0];

  return firstDirection?.label || firstKeyword || "本地分析报告";
}

function getHistoryDescription(report: AnalysisReport): string {
  const directionSummary =
    report.jobDirection.find((item) => item.description.trim().length > 0)
      ?.description || report.summary;

  return truncateText(directionSummary, 56);
}

function createHistoryEntry(report: AnalysisReport): LocalReportHistoryEntry {
  const createdAt = new Date().toISOString();

  return {
    createdAt,
    description: getHistoryDescription(report),
    id: `local-${Date.now()}`,
    report: sanitizeReportForHistory(report),
    score: report.score,
    title: getHistoryTitle(report)
  };
}

function upsertLocalReportHistory(
  report: AnalysisReport,
  currentHistory: LocalReportHistoryEntry[]
): LocalReportHistoryEntry[] {
  const nextEntry = createHistoryEntry(report);
  const dedupedHistory = currentHistory.filter(
    (entry) =>
      entry.report.score !== report.score ||
      entry.report.summary !== report.summary
  );

  return [nextEntry, ...dedupedHistory].slice(0, MAX_LOCAL_HISTORY_ITEMS);
}

function truncateText(value: string, maxLength: number): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= maxLength) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, maxLength)}...`;
}

function formatHistoryTime(createdAt: string): string {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "本地历史";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(createdDate);
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

function EmptyResultState() {
  return (
    <section className="rounded-[14px] border border-line bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        暂无报告
      </p>
      <h2 className="mt-2 text-lg font-semibold text-ink">
        还没有可查看的本地分析报告
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        当前页面没有读取到本次 session 报告，也没有找到浏览器本地历史记录。请回到首页重新上传简历并粘贴岗位要求发起分析。
      </p>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
        历史仅保存在当前浏览器，本地数据清理后不可恢复。
      </p>
      <Link
        className="mt-5 inline-flex w-fit items-center justify-center rounded-[12px] border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
        href="/"
      >
        返回首页分析
      </Link>
    </section>
  );
}

function LoadingResultState() {
  return (
    <section className="rounded-[14px] border border-line bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <p className="text-sm font-semibold text-ink">正在读取本地报告...</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        正在检查本次 session 和当前浏览器的本地历史记录。
      </p>
    </section>
  );
}

export default function ResultPage() {
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<LocalReportHistoryEntry[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [reportSource, setReportSource] = useState<ReportSource>("loading");

  useEffect(() => {
    const storedReport = readStoredReport();
    const storedHistory = readLocalReportHistory();

    if (storedReport) {
      const nextHistory = upsertLocalReportHistory(storedReport, storedHistory);

      writeLocalReportHistory(nextHistory);
      setLocalHistory(nextHistory);
      setReport(storedReport);
      setActiveHistoryId(nextHistory[0]?.id ?? null);
      setReportSource("session");
      return;
    }

    setLocalHistory(storedHistory);

    if (storedHistory[0]) {
      setReport(storedHistory[0].report);
      setActiveHistoryId(storedHistory[0].id);
      setReportSource("history");
      return;
    }

    setReportSource("empty");
  }, []);

  function handleSelectHistory(entry: LocalReportHistoryEntry) {
    setReport(entry.report);
    setActiveHistoryId(entry.id);
    setReportSource("history");
  }

  function handleSelectHistoryById(id: string) {
    const entry = localHistory.find((historyEntry) => historyEntry.id === id);

    if (entry) {
      handleSelectHistory(entry);
    }
  }

  function handleDeleteHistory(id: string) {
    const nextHistory = localHistory.filter((entry) => entry.id !== id);

    writeLocalReportHistory(nextHistory);
    setLocalHistory(nextHistory);

    if (id !== activeHistoryId || reportSource === "session") {
      return;
    }

    if (nextHistory[0]) {
      setReport(nextHistory[0].report);
      setActiveHistoryId(nextHistory[0].id);
      setReportSource("history");
      return;
    }

    setReport(null);
    setActiveHistoryId(null);
    setReportSource("empty");
  }

  function handleClearHistory() {
    writeLocalReportHistory([]);
    setLocalHistory([]);
    setActiveHistoryId(null);

    if (reportSource === "history") {
      setReport(null);
      setReportSource("empty");
    }
  }

  const sidebarHistory: HistoryItem[] = localHistory.map((entry) => ({
    active: entry.id === activeHistoryId,
    company: entry.title,
    id: entry.id,
    role: entry.description,
    score: entry.score,
    time: formatHistoryTime(entry.createdAt)
  }));

  const currentReport = report
    ? {
        ...report,
        history: sidebarHistory
      }
    : null;

  const displayableSegments = currentReport ? getDisplayableSegments(currentReport) : [];
  const resumeReviewText = currentReport?.resumeDisplayText || currentReport?.resumeOriginal;
  const hasResumeReview = Boolean(
    resumeReviewText?.trim() && currentReport?.annotations?.length
  );
  const hasMainContent = hasResumeReview || displayableSegments.length > 0;

  return (
    <main
      className="min-h-screen bg-white text-ink lg:flex"
      data-report-source={reportSource}
    >
      <HistorySidebar
        currentScore={currentReport?.score}
        history={sidebarHistory}
        onClearHistory={handleClearHistory}
        onDeleteHistory={handleDeleteHistory}
        onSelectHistory={handleSelectHistoryById}
      />

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
            {currentReport ? (
              <>
                <ScoreDashboard report={currentReport} />
                <ReportLegend />

                <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
                  <div className="min-w-0 space-y-4">
                    <div className="space-y-4 xl:hidden">
                      <JobDirectionSection report={currentReport} />
                      <KeywordAnalysisSection report={currentReport} />
                    </div>
                    {hasMainContent ? (
                      <ReportViewer
                        annotations={currentReport.annotations}
                        requirementChecks={currentReport.requirementChecks}
                        resumeOriginal={resumeReviewText}
                        segments={displayableSegments}
                      />
                    ) : (
                      <DetailEmptyState report={currentReport} />
                    )}
                    <div className="xl:hidden">
                      <ExportReportSection report={currentReport} />
                    </div>
                    <p className="px-1 text-xs leading-5 text-slate-400">
                      {reportSource === "session"
                        ? "本报告由 AI 根据本次上传内容生成，仅供参考，建议结合自身实际情况判断。"
                        : "本报告来自当前浏览器本地历史记录；历史仅保存在当前浏览器，本地数据清理后不可恢复。报告仅供参考，建议结合自身实际情况判断。"}
                    </p>
                  </div>

                  <SummarySidebar className="hidden xl:block" report={currentReport} />
                </div>
              </>
            ) : reportSource === "loading" ? (
              <LoadingResultState />
            ) : (
              <EmptyResultState />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
