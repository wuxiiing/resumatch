"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import type { HistoryItem } from "@/types/analysis";

type HistorySidebarProps = {
  currentScore?: number;
  history: HistoryItem[];
};

export function HistorySidebar({ currentScore, history }: HistorySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`border-b border-line bg-slate-50/80 p-4 transition-[width] lg:min-h-screen lg:shrink-0 lg:border-b-0 lg:border-r ${
        isCollapsed ? "lg:w-[76px]" : "lg:w-[292px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={isCollapsed ? "overflow-hidden lg:w-0" : undefined}>
          <Logo />
        </div>
        <button
          aria-label={isCollapsed ? "展开历史记录" : "收起历史记录"}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-slate-500 hover:border-cyan-200 hover:text-brand-dark"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="text-base leading-none">
            {isCollapsed ? "›" : "‹"}
          </span>
        </button>
      </div>

      <label className={isCollapsed ? "mt-8 hidden lg:hidden" : "mt-8 block"}>
        <span className="sr-only">搜索历史记录</span>
        <input
          className="w-full rounded-[12px] border-line bg-white text-sm placeholder:text-slate-400 focus:border-brand focus:ring-brand"
          placeholder="搜索历史记录"
          readOnly
          type="search"
        />
      </label>

      <div className={isCollapsed ? "mt-5 hidden lg:hidden" : "mt-5 space-y-3"}>
        {history.map((item) => {
          const displayScore =
            item.active && typeof currentScore === "number"
              ? currentScore
              : item.score;

          return (
            <article
              className={`rounded-[12px] border bg-white p-4 ${
                item.active ? "border-brand bg-cyan-50/50" : "border-line"
              }`}
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-ink">
                    {item.company}
                  </h2>
                  <p className="mt-1 truncate text-xs text-muted">{item.role}</p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${scoreColor(displayScore)}`}>
                  {displayScore}%
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{item.time}</p>
            </article>
          );
        })}
      </div>

      <button
        className="mt-5 w-full rounded-[12px] border border-line bg-white px-4 py-2 text-sm font-medium text-muted"
        disabled
        type="button"
        hidden={isCollapsed}
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
