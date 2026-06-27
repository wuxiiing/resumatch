"use client";

// 简配 2.0 · 左导航。重排逻辑：研判是核心 → 主动作「研判新岗位」最显眼、历史为主体；
// 简历/小简降为底部次要入口；简历修改不在这里，从研判结果里引出。竹影 + hover 手感。

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadHistory, openHistoryItem, type HistoryItem } from "@/lib/history";

function BambooFoot() {
  return (
    <svg viewBox="0 0 120 80" className="pointer-events-none absolute bottom-12 left-0 h-24 w-full" style={{ color: "#52724b", opacity: 0.06 }} aria-hidden>
      <g transform="rotate(-7 30 60)" fill="currentColor">
        <rect x="22" y="0" width="6" height="24" rx="3" />
        <rect x="22" y="27" width="6" height="26" rx="3" />
        <rect x="22" y="56" width="6" height="26" rx="3" />
        <rect x="20" y="24" width="10" height="3" rx="1.5" />
        <rect x="20" y="53" width="10" height="3" rx="1.5" />
        <path d="M28 12 Q46 4 56 9 Q42 18 28 16 Z" />
        <path d="M28 34 Q44 34 52 44 Q38 44 28 37 Z" />
      </g>
    </svg>
  );
}

export function AppNav({ current }: { current?: "profile" | "career" }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gf-rule px-4">
        <span className="font-serifcn text-[17px] font-semibold text-gf-ink">
          简<span className="text-gf-green">配</span>
        </span>
        <span className="text-[11px] tracking-[0.1em] text-gf-faint">求职军师</span>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/agent"
          className="group mb-5 flex items-center justify-center gap-2 rounded-xl bg-gf-green px-4 py-2.5 font-serifcn text-[14.5px] text-white shadow-[0_4px_14px_rgba(82,114,75,0.25)] transition-all duration-200 ease-out hover:bg-gf-greend hover:shadow-[0_6px_18px_rgba(82,114,75,0.32)] active:scale-[0.98]"
        >
          <span className="text-[17px] leading-none transition-transform duration-300 ease-out group-hover:rotate-90">＋</span>
          研判新岗位
        </Link>

        <div className="mb-2 px-1 text-[11px] tracking-[0.14em] text-gf-faint">我的研判</div>
        {history.length === 0 ? (
          <p className="px-1 text-[12px] leading-relaxed text-gf-faint">研判过的岗位会留在这里,随时点开重看。</p>
        ) : (
          <div className="space-y-0.5">
            {history.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => openHistoryItem(it)}
                className="group block w-full rounded-lg px-2.5 py-2 text-left transition-all duration-150 ease-out hover:translate-x-0.5 hover:bg-gf-greentint/60"
              >
                <div className="truncate text-[13px] text-gf-soft transition-colors group-hover:text-gf-greend">{it.label}</div>
                <div className="text-[10.5px] text-gf-faint">{it.date}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BambooFoot />

      <div className="relative z-10 shrink-0 space-y-0.5 border-t border-gf-rule bg-gf-surface/40 px-3 py-2.5">
        <Link
          href="/profile"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors ${
            current === "profile" ? "bg-gf-greentint font-medium text-gf-greend" : "text-gf-soft hover:bg-gf-greentint/50"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gf-faint" aria-hidden>
            <path d="M5 3h6l4 4v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
            <path d="M11 3v4h4" />
          </svg>
          我的简历
        </Link>
        <Link
          href="/career"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors ${
            current === "career" ? "bg-gf-greentint font-medium text-gf-greend" : "text-gf-soft hover:bg-gf-greentint/50"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gf-faint" aria-hidden>
            <path d="M4 4h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8l-4 3V5a1 1 0 0 1 0-1z" />
          </svg>
          问小简 · 职业规划
        </Link>
      </div>
    </div>
  );
}
