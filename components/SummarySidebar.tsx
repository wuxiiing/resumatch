import type { AnalysisReport } from "@/types/analysis";

type SummarySidebarProps = {
  report: AnalysisReport;
};

export function SummarySidebar({ report }: SummarySidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-[14px] border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">整体评语</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{report.summary}</p>
      </section>

      <section className="rounded-[14px] border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">优化建议汇总</h2>
        <div className="mt-4 space-y-3">
          {report.suggestions.map((item) => (
            <div
              className="flex items-center justify-between rounded-[12px] border border-line bg-slate-50 px-4 py-3"
              key={item.label}
            >
              <span className="text-sm text-slate-700">{item.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-brand-dark">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">导出报告</h2>
        <div className="mt-4 rounded-[12px] border border-dashed border-cyan-200 bg-cyan-50/50 p-4">
          <p className="text-sm font-medium text-ink">Word 报告占位</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            正式版本将包含分析摘要、简历原文干净版和优化建议清单。
          </p>
        </div>
        <button
          className="mt-4 w-full rounded-[12px] bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
          disabled
          type="button"
        >
          下载 Word 报告（占位）
        </button>
      </section>
    </aside>
  );
}
