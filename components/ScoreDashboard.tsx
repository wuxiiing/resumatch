import type { AnalysisReport } from "@/types/analysis";

type ScoreDashboardProps = {
  report: AnalysisReport;
};

export function ScoreDashboard({ report }: ScoreDashboardProps) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-6 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div>
          <p className="text-sm font-semibold text-ink">匹配度评分</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-6xl font-semibold leading-none text-transparent">
              {report.score}
            </span>
            <span className="pb-2 text-xl font-medium text-slate-400">/100</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">{report.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <KeywordGroup
            items={report.matchedKeywords}
            label="已匹配关键词"
            tone="matched"
          />
          <KeywordGroup
            items={report.missingKeywords}
            label="缺失关键词"
            tone="missing"
          />
        </div>
      </div>
    </section>
  );
}

function KeywordGroup({
  items,
  label,
  tone
}: {
  items: string[];
  label: string;
  tone: "matched" | "missing";
}) {
  const chipClass =
    tone === "matched"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-600";

  return (
    <div className="rounded-[12px] border border-line bg-slate-50/70 p-4">
      <h3 className="text-sm font-semibold text-ink">{label}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${chipClass}`}
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
