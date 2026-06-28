"use client";

// 简配 2.0 · 简历修改独立页。装进 AppShell + 共享导航;主区 = 简历工作台（结构化编辑 + 专业导出）。

import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";
import { ResumeWorkbench } from "@/components/ResumeWorkbench";

export default function ResumePage() {
  return (
    <AppShell brand={<span className="truncate text-[13.5px] text-gf-soft">简历修改</span>} nav={<AppNav />}>
      <ResumeWorkbench />
    </AppShell>
  );
}
