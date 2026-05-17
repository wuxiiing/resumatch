import type { ReportSegment, SegmentStatus } from "@/types/analysis";

type ReportViewerProps = {
  segments: ReportSegment[];
};

const statusMeta: Record<
  SegmentStatus,
  {
    label: string;
    className: string;
  }
> = {
  relevant: {
    label: "与 JD 匹配",
    className: "border-emerald-200 bg-emerald-50"
  },
  optimize: {
    label: "可优化",
    className: "border-amber-200 bg-amber-50"
  },
  irrelevant: {
    label: "可考虑精简",
    className: "border-slate-200 bg-slate-50"
  }
};

export function ReportViewer({ segments }: ReportViewerProps) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
      <div className="border-b border-line pb-4">
        <h2 className="text-base font-semibold text-ink">简历分析详情</h2>
        <p className="mt-1 text-sm text-muted">
          以下为静态标注报告占位，正式版本仅做只读展示。
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {segments.map((segment) => {
          const meta = statusMeta[segment.status];

          return (
            <article
              className={`rounded-[12px] border p-4 ${meta.className}`}
              key={segment.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{segment.section}</h3>
                <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                  {meta.label}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {segment.original}
              </p>
              {segment.status === "optimize" ? (
                <div className="mt-4 rounded-[10px] border border-amber-200 bg-white/75 p-4">
                  <p className="text-xs font-semibold text-amber-700">问题说明</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {segment.comment}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-amber-700">
                    修改建议
                  </p>
                  <div className="mt-2 rounded-[10px] border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {segment.suggestion}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ReportLegend() {
  const items = [
    { color: "bg-emerald-500", text: "绿色：与 JD 高度相关，建议保留" },
    { color: "bg-amber-500", text: "黄色：内容有价值，建议优化表达" },
    { color: "bg-slate-400", text: "灰色：与目标岗位关联度较低" }
  ];

  return (
    <section className="rounded-[12px] border border-line bg-white px-4 py-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
          <span
            className="inline-flex items-center gap-2 text-xs leading-5 text-muted"
            key={item.text}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.text}
          </span>
        ))}
      </div>
    </section>
  );
}
