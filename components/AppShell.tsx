"use client";

// 简配 2.0 · 应用外壳:左导航 + 主区 + 右栏(军师)。
// SaaS 的骨(标准三栏 + 可折叠 + 响应式),国风的皮(宣纸底、竹青、发丝线)。
// 桌面:左右栏内联收放(width 过渡);移动:抽屉(translateX)。两侧都能收。

import { useState, type ReactNode } from "react";
import { CreditBar } from "./CreditBar";

function IconMenu() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8l-4 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function AppShell({
  brand,
  nav,
  children,
  aside,
  asideLabel = "问军师",
  tone = "bg-gf-paper" // 页面底色微差:研判=宣纸(默认) / 简历台=象牙 / 小简=微竹青
}: {
  brand?: ReactNode;
  nav: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  asideLabel?: string;
  tone?: string;
}) {
  const [navCollapsed, setNavCollapsed] = useState(false); // 桌面左栏
  const [asideCollapsed, setAsideCollapsed] = useState(false); // 桌面右栏
  const [drawer, setDrawer] = useState<null | "nav" | "aside">(null); // 移动抽屉

  return (
    <div className={`flex h-[100dvh] overflow-hidden ${tone} font-sans text-gf-ink`}>
      {/* 左导航 · 桌面内联收放 */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-gf-rule bg-gf-surface/60 transition-[width] duration-300 ease-out lg:block ${
          navCollapsed ? "w-0" : "w-[214px]"
        }`}
      >
        <div className="flex h-full w-[214px] flex-col">{nav}</div>
      </aside>

      {/* 主列 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-gf-rule bg-gf-paper/90 px-2.5 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNavCollapsed((v) => !v)}
              className="hidden rounded-md p-1.5 text-gf-soft transition-colors hover:bg-gf-greentint lg:inline-flex"
              aria-label={navCollapsed ? "展开导航" : "收起导航"}
            >
              <IconMenu />
            </button>
            <button
              type="button"
              onClick={() => setDrawer("nav")}
              className="rounded-md p-1.5 text-gf-soft transition-colors hover:bg-gf-greentint lg:hidden"
              aria-label="打开导航"
            >
              <IconMenu />
            </button>
            <div className="min-w-0 truncate">{brand}</div>
          </div>
          <div className="relative flex items-center gap-2">
            <CreditBar />
              {aside && (
            <>
              <button
                type="button"
                onClick={() => setAsideCollapsed((v) => !v)}
                className="hidden items-center gap-1.5 rounded-md border border-gf-rule px-2.5 py-1 text-[12.5px] text-gf-soft transition-colors hover:bg-gf-greentint lg:inline-flex"
              >
                <IconChat />
                {asideCollapsed ? asideLabel : "收起军师"}
              </button>
              <button
                type="button"
                onClick={() => setDrawer("aside")}
                className="inline-flex items-center gap-1.5 rounded-md border border-gf-rule px-2.5 py-1 text-[12.5px] text-gf-soft transition-colors hover:bg-gf-greentint lg:hidden"
              >
                <IconChat />
                {asideLabel}
              </button>
            </>
          )}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* 右栏 · 桌面内联收放 */}
      {aside && (
        <aside
          className={`hidden shrink-0 overflow-hidden border-l border-gf-rule bg-gf-surface/60 transition-[width] duration-300 ease-out lg:block ${
            asideCollapsed ? "w-0" : "w-[340px]"
          }`}
        >
          <div className="flex h-full w-[340px] flex-col">{aside}</div>
        </aside>
      )}

      {/* 移动抽屉 · 导航 / 军师 共用 */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-gf-ink/30 opacity-100 transition-opacity"
            onClick={() => setDrawer(null)}
          />
          <div
            className={`absolute top-0 h-full bg-gf-paper shadow-2xl ${
              drawer === "nav" ? "left-0 w-[80vw] max-w-[300px]" : "right-0 w-[90vw] max-w-[360px]"
            }`}
          >
            <div className="flex h-full flex-col">{drawer === "nav" ? nav : aside}</div>
          </div>
        </div>
      )}
    </div>
  );
}
