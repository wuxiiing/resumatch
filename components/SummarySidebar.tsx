import type { AnalysisReport } from "@/types/analysis";

type SummarySidebarProps = {
  report: AnalysisReport;
};

export function SummarySidebar({ report }: SummarySidebarProps) {
  return (
    <aside className="min-w-0 space-y-4">
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

      <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <h2 className="text-base font-semibold text-ink">优化建议汇总</h2>
        <div className="mt-4 divide-y divide-line">
          {report.suggestions.map((item) => (
            <div
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              key={item.label}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {item.description}
                </p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-brand-dark ring-1 ring-cyan-100">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <h2 className="text-base font-semibold text-ink">导出报告</h2>
        <div className="mt-4 rounded-[12px] border border-dashed border-cyan-200 bg-cyan-50/45 p-4">
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
