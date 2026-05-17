"use client";

import {
  useEffect,
  useRef,
  type PointerEvent
} from "react";
import type { AnalysisReport } from "@/types/analysis";

type ScoreDashboardProps = {
  report: AnalysisReport;
};

export function ScoreDashboard({ report }: ScoreDashboardProps) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
      <div className="grid min-w-0 lg:grid-cols-[224px_minmax(0,1fr)]">
        <div className="border-b border-line px-5 py-5 lg:border-b-0 lg:border-r">
          <p className="text-sm font-semibold text-ink">匹配度评分</p>
          <div className="mt-3 flex items-end gap-1">
            <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-[64px] font-semibold leading-none text-transparent">
              {report.score}
            </span>
            <span className="pb-2 text-xl font-medium text-slate-400">/100</span>
          </div>
        </div>

        <div className="min-w-0 px-5 py-5">
          <p className="text-sm font-semibold text-ink">整体评价</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            {report.summary}
          </p>
        </div>
      </div>

      <div className="border-t border-line bg-slate-50/45 px-5 py-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-0">
          <KeywordStrip
            items={report.matchedKeywords}
            label="已匹配关键词"
            tone="matched"
          />
          <KeywordStrip
            className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
            items={report.missingKeywords}
            label="缺失关键词"
            tone="missing"
          />
        </div>
      </div>
    </section>
  );
}

function KeywordStrip({
  className = "",
  items,
  label,
  tone
}: {
  className?: string;
  items: string[];
  label: string;
  tone: "matched" | "missing";
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    scrollLeft: 0,
    startX: 0
  });
  const chipClass =
    tone === "matched"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-600";

  useEffect(() => {
    const strip = stripRef.current;

    if (!strip) {
      return;
    }

    const currentStrip = strip;

    function handleNativeWheel(event: WheelEvent) {
      const hasHorizontalOverflow =
        currentStrip.scrollWidth > currentStrip.clientWidth;

      if (!hasHorizontalOverflow) {
        return;
      }

      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        currentStrip.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    }

    currentStrip.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      currentStrip.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.currentTarget;

    if (target.scrollWidth <= target.clientWidth) {
      return;
    }

    dragState.current = {
      active: true,
      scrollLeft: target.scrollLeft,
      startX: event.clientX
    };
    target.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current.active) {
      return;
    }

    const target = event.currentTarget;
    target.scrollLeft =
      dragState.current.scrollLeft - (event.clientX - dragState.current.startX);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    dragState.current.active = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="shrink-0 text-sm font-semibold text-ink">{label}</h2>
        <div
          aria-label={`${label}，可横向滚动浏览`}
          className="keyword-scroll flex h-9 min-w-0 flex-1 cursor-grab flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pr-1 active:cursor-grabbing"
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerEnd}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={stripRef}
          role="list"
        >
          {items.map((item) => (
            <span
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${chipClass}`}
              key={item}
              role="listitem"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
