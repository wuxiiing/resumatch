"use client";

// 简配 2.0 · 简历修改独立页。装进 AppShell + 共享导航;主区 = 简历工作台。
// 建议(扬长/避短)取自最近一次研判(sessionStorage),没有就纯改简历。

import { useEffect, useState } from "react";
import { AGENT_REPORT_KEY, type AgentReport } from "@/lib/agent-report";
import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";
import { ResumeWorkbench } from "@/components/ResumeWorkbench";

export default function ResumePage() {
  const [report, setReport] = useState<AgentReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AGENT_REPORT_KEY);
      if (raw) setReport(JSON.parse(raw) as AgentReport);
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const histLabel = report ? [report.meta.company, report.meta.position].filter(Boolean).join(" · ") || null : null;

  return (
    <AppShell
      brand={<span className="truncate text-[13.5px] text-gf-soft">简历修改</span>}
      nav={<AppNav active="resume" histLabel={histLabel} />}
    >
      <ResumeWorkbench strategy={report?.actionPlan.resumeStrategy ?? null} />
    </AppShell>
  );
}
