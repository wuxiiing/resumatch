"use client";

import { useEffect, useState } from "react";
import type { AnalysisReport } from "@/types/analysis";

type SummarySidebarProps = {
  className?: string;
  report: AnalysisReport;
};

export function SummarySidebar({ className = "", report }: SummarySidebarProps) {
  return (
    <aside className={`min-w-0 space-y-4 ${className}`}>
      <JobDirectionSection report={report} />
      <KeywordAnalysisSection report={report} />
      <ExportReportSection report={report} />
    </aside>
  );
}

export function JobDirectionSection({ report }: { report: AnalysisReport }) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <h2 className="text-base font-semibold text-ink">岗位方向</h2>
      <div className="mt-4 space-y-4">
        {report.jobDirection.map((item) => (
          <div className="border-l-2 border-cyan-200 pl-3" key={item.label}>
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KeywordAnalysisSection({ report }: { report: AnalysisReport }) {
  const coveredKeywords = getKeywordItems([
    ...report.matchedKeywords,
    ...(report.requirementChecks
      ?.filter((check) => check.status === "present")
      .map((check) => check.label) ?? [])
  ]);
  const weakKeywords = getKeywordItems([
    ...(report.requirementChecks
      ?.filter((check) => check.status === "weak")
      .map((check) => check.label) ?? [])
  ]);
  const missingKeywords = getKeywordItems(getMissingLabels(report));
  const irrelevantKeywords = getKeywordItems([
    ...(report.annotations ?? [])
      .filter((annotation) => annotation.status === "remove")
      .map((annotation) => annotation.relatedJdNeed || annotation.section || annotation.original),
    ...report.segments
      .filter((segment) => segment.status === "irrelevant")
      .map((segment) => segment.section)
  ]);

  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <h2 className="text-base font-semibold text-ink">关键词分析</h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        正文只标出可定位到原文的批注；这里汇总 JD 关键词覆盖情况。
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-800">已覆盖关键词</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {coveredKeywords.map((keyword) => (
              <span
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                key={keyword}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800">待优化/表达补强</p>
          {weakKeywords.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {weakKeywords.map((keyword) => (
                <span
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                  key={keyword}
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted">
              暂无明显表达补强项，重点保持证据清晰。
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-800">补充建议</p>
          {missingKeywords.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {missingKeywords.map((keyword) => (
                <span
                  className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                  key={keyword}
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted">
              暂无明确缺失项。
            </p>
          )}
        </div>

        {irrelevantKeywords.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-slate-800">弱相关</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {irrelevantKeywords.map((keyword) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                  key={keyword}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ExportReportSection({ report }: { report: AnalysisReport }) {
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState("ResuMatch-分析报告.docx");
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    return () => {
      if (exportUrl) {
        URL.revokeObjectURL(exportUrl);
      }
    };
  }, [exportUrl]);

  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <h2 className="text-base font-semibold text-ink">导出报告</h2>
      <div className="mt-4 rounded-[12px] border border-dashed border-cyan-200 bg-cyan-50/45 p-4">
        <p className="text-sm font-medium text-ink">生成 Word 报告</p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
          <li>包含分析报告摘要。</li>
          <li>包含简历原文干净版。</li>
          <li>包含优化建议清单。</li>
        </ul>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          如果内置浏览器没有弹出下载，请在系统浏览器打开后导出。
        </p>
      </div>
      {exportError ? (
        <p className="mt-3 text-xs leading-5 text-red-600">{exportError}</p>
      ) : null}
      <button
        className="mt-4 w-full rounded-[12px] bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        disabled={isExporting || !report}
        onClick={() =>
          void handleExportWord(report, {
            exportUrl,
            setExportError,
            setExportFilename,
            setExportUrl,
            setIsExporting
          })
        }
        type="button"
      >
        {isExporting ? "正在生成 Word..." : "导出 Word 报告"}
      </button>
      {exportUrl ? (
        <a
          className="mt-3 inline-flex w-full items-center justify-center rounded-[12px] border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
          download={exportFilename}
          href={exportUrl}
          rel="noreferrer"
          target="_blank"
        >
          自动下载没反应？点这里打开/保存
        </a>
      ) : null}
    </section>
  );
}

type ExportWordHandlers = {
  exportUrl: string | null;
  setExportError: (value: string | null) => void;
  setExportFilename: (value: string) => void;
  setExportUrl: (value: string | null) => void;
  setIsExporting: (value: boolean) => void;
};

async function handleExportWord(
  report: AnalysisReport,
  {
    exportUrl,
    setExportError,
    setExportFilename,
    setExportUrl,
    setIsExporting
  }: ExportWordHandlers
) {
  setIsExporting(true);
  setExportError(null);

  try {
    const response = await fetch("/api/export-word", {
      body: JSON.stringify({ report }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("export failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const filename = getDownloadFilename(response) || "ResuMatch-分析报告.docx";
    const link = document.createElement("a");

    if (exportUrl) {
      URL.revokeObjectURL(exportUrl);
    }

    setExportUrl(url);
    setExportFilename(filename);
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    setExportError("导出失败，请重新分析后再试。");
  } finally {
    setIsExporting(false);
  }
}

function getDownloadFilename(response: Response): string | null {
  const disposition = response.headers.get("Content-Disposition");
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];

  return encodedFilename ? decodeURIComponent(encodedFilename) : null;
}

function getMissingLabels(report: AnalysisReport): string[] {
  const missingChecks = report.requirementChecks
    ?.filter((check) => check.status === "missing")
    .map((check) => check.label);

  return missingChecks && missingChecks.length > 0
    ? missingChecks
    : report.missingKeywords;
}

function getKeywordItems(items: string[]): string[] {
  const seen = new Set<string>();

  return items
    .map((item) => item.trim())
    .filter((item) => isMeaningfulText(item) && item.length <= 18)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 8);
}

function isMeaningfulText(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return !["", "无", "无需", "不需要修改", "n/a", "-", "na"].includes(normalized);
}
