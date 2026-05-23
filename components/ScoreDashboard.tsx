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
  const coveredKeywords = getKeywordItems([
    ...report.matchedKeywords,
    ...getRequirementLabels(report, "present")
  ]);
  const weakKeywords = getKeywordItems([
    ...getRequirementLabels(report, "weak")
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
        <div
          className="grid min-w-0 gap-4 lg:grid-cols-4 lg:gap-0"
        >
          <KeywordStrip
            items={coveredKeywords}
            label="已覆盖关键词"
            tone="matched"
          />
          <KeywordStrip
            className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
            items={weakKeywords}
            label="待优化/表达补强"
            tone="weak"
          />
          <KeywordStrip
            className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
            items={missingKeywords}
            label="补充建议"
            tone="missing"
          />
          <KeywordStrip
            className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
            items={irrelevantKeywords}
            label="弱相关"
            tone="irrelevant"
          />
        </div>
      </div>
    </section>
  );
}

function getRequirementLabels(
  report: AnalysisReport,
  status: "present" | "weak"
): string[] {
  return (
    report.requirementChecks
      ?.filter((check) => check.status === status)
      .map((check) => check.label) ?? []
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

function KeywordStrip({
  className = "",
  items,
  label,
  tone
}: {
  className?: string;
  items: string[];
  label: string;
  tone: "matched" | "weak" | "missing" | "irrelevant";
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    scrollLeft: 0,
    startX: 0
  });
  const chipClass = {
    matched: "border-emerald-100 bg-emerald-50 text-emerald-700",
    weak: "border-amber-100 bg-amber-50 text-amber-700",
    missing: "border-rose-100 bg-rose-50 text-rose-700",
    irrelevant: "border-slate-200 bg-slate-100 text-slate-500"
  }[tone];

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
