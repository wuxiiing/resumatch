import { Logo } from "@/components/Logo";
import type { HistoryItem } from "@/types/analysis";

type HistorySidebarProps = {
  history: HistoryItem[];
};

export function HistorySidebar({ history }: HistorySidebarProps) {
  return (
    <aside className="border-b border-line bg-slate-50/80 p-4 lg:min-h-screen lg:w-[292px] lg:border-b-0 lg:border-r">
      <Logo />

      <label className="mt-8 block">
        <span className="sr-only">搜索历史记录</span>
        <input
          className="w-full rounded-[12px] border-line bg-white text-sm placeholder:text-slate-400 focus:border-brand focus:ring-brand"
          placeholder="搜索历史记录"
          readOnly
          type="search"
        />
      </label>

      <div className="mt-5 space-y-3">
        {history.map((item) => (
          <article
            className={`rounded-[12px] border bg-white p-4 ${
              item.active
                ? "border-brand bg-cyan-50/50"
                : "border-line"
            }`}
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">{item.company}</h2>
                <p className="mt-1 text-xs text-muted">{item.role}</p>
              </div>
              <span className={`text-sm font-semibold ${scoreColor(item.score)}`}>
                {item.score}%
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{item.time}</p>
          </article>
        ))}
      </div>

      <button
        className="mt-5 w-full rounded-[12px] border border-line bg-white px-4 py-2 text-sm font-medium text-muted"
        disabled
        type="button"
      >
        清空历史记录（占位）
      </button>
    </aside>
  );
}

function scoreColor(score: number) {
  if (score >= 80) {
    return "text-emerald-600";
  }

  if (score >= 70) {
    return "text-amber-600";
  }

  return "text-red-500";
}
