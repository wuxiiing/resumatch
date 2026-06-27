"use client";

// 简配 2.0 · 共享左导航。各功能页复用;active 标当前页,已建的项 Link 跳转,未建的诚实标「待建」。

import Link from "next/link";

export type NavKey = "verdict" | "profile" | "career" | "resume";

const FN_ITEMS: { key: NavKey; label: string; href?: string; tag?: string }[] = [
  { key: "verdict", label: "岗位研判", href: "/agent-result" },
  { key: "profile", label: "个人简历" },
  { key: "career", label: "职业规划", href: "/career", tag: "小简" },
  { key: "resume", label: "简历修改", href: "/resume" }
];

export function AppNav({ active, histLabel }: { active: NavKey; histLabel?: string | null }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-gf-rule px-4">
        <span className="font-serifcn text-[16px] font-semibold text-gf-ink">
          简<span className="text-gf-green">配</span>
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="px-2 pb-1.5 text-[11px] tracking-wide text-gf-faint">功能</div>
        {FN_ITEMS.map((it) => {
          const isActive = it.key === active;
          const soon = !it.href;
          const inner = (
            <div
              className={`mb-0.5 flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-gf-greentint font-medium text-gf-greend"
                  : soon
                    ? "text-gf-faint"
                    : "text-gf-soft hover:bg-gf-greentint"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {it.label}
                {it.tag && <span className="text-[10px] text-gf-green">{it.tag}</span>}
              </span>
              {soon && <span className="text-[10px] text-gf-faint">待建</span>}
            </div>
          );
          if (soon || isActive) return <div key={it.key}>{inner}</div>;
          return (
            <Link key={it.key} href={it.href as string}>
              {inner}
            </Link>
          );
        })}
        <div className="mt-3 border-t border-gf-rule px-2 pb-1.5 pt-3 text-[11px] tracking-wide text-gf-faint">历史记录</div>
        {histLabel ? (
          <div className="rounded-md bg-gf-greentint px-2.5 py-1.5 text-[12.5px] leading-snug text-gf-greend">{histLabel}</div>
        ) : (
          <div className="px-2.5 text-[12px] text-gf-faint">还没有研判</div>
        )}
      </nav>
      <div className="shrink-0 border-t border-gf-rule px-4 py-2.5">
        <Link href="/agent" className="text-[12.5px] text-gf-soft transition-colors hover:text-gf-green">
          + 研判一个新岗位
        </Link>
      </div>
    </div>
  );
}
