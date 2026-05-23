import type { AnalysisReport } from "@/types/analysis";

type SummarySidebarProps = {
  report: AnalysisReport;
};

export function SummarySidebar({ report }: SummarySidebarProps) {
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
        <h2 className="text-base font-semibold text-ink">JD 痛点</h2>
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

      <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <h2 className="text-base font-semibold text-ink">导出报告</h2>
        <div className="mt-4 rounded-[12px] border border-dashed border-cyan-200 bg-cyan-50/45 p-4">
          <p className="text-sm font-medium text-ink">Word 导出即将支持</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
            <li>将包含分析报告摘要。</li>
            <li>将包含简历原文干净版。</li>
            <li>将包含优化建议清单。</li>
          </ul>
        </div>
        <button
          className="mt-4 w-full rounded-[12px] bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
          disabled
          type="button"
        >
          Word 导出即将支持
        </button>
      </section>
    </aside>
  );
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
