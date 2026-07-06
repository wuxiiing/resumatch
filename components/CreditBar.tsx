"use client";

import { useEffect, useState } from "react";

type CreditInfo = {
  used: number; left: number; daily: number;
  costs: Record<string, number>;
  hardCaps: Record<string, number>;
};

export function CreditBar() {
  const [info, setInfo] = useState<CreditInfo | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(setInfo).catch(() => {});
  }, []);

  if (!info) return null;

  const pct = Math.round((info.left / info.daily) * 100);
  const barColor = pct > 50 ? "bg-gf-green" : pct > 20 ? "bg-gf-amber" : "bg-gf-seal";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-gf-rule px-2.5 py-1 text-[11px] text-gf-soft transition-colors hover:bg-gf-greentint/40"
        title="今日免费额度"
      >
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gf-rule">
          <span className={`block h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </span>
        <span>{info.left}/{info.daily}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-gf-rule bg-gf-surface p-3 shadow-lg">
          <p className="mb-2 text-[12px] font-medium text-gf-ink">今日免费额度 · 每天 0 点重置</p>
          <div className="space-y-1 text-[11px] text-gf-soft">
            <div className="flex justify-between"><span>🕵 研判分析</span><span className="text-gf-ink">{info.costs.analyze} 点/次 · 限 {info.hardCaps.analyze} 次</span></div>
            <div className="flex justify-between"><span>📸 图片简历</span><span className="text-gf-ink">{info.costs.image} 点/次</span></div>
            <div className="flex justify-between"><span>🗺 职业路径</span><span className="text-gf-ink">{info.costs.career} 点/次</span></div>
            <div className="flex justify-between"><span>🔍 背调/岗位调查</span><span className="text-gf-ink">{info.costs.recon} 点/次</span></div>
            <div className="flex justify-between"><span>💬 军师对话</span><span className="text-gf-ink">{info.costs.chat} 点/条</span></div>
            <div className="flex justify-between"><span>📝 简历整理</span><span className="text-gf-ink">{info.costs.structure} 点/次</span></div>
            <div className="flex justify-between"><span>📄 文件解析</span><span className="text-gf-faint">免费</span></div>
            <div className="flex justify-between"><span>📥 导出</span><span className="text-gf-faint">免费</span></div>
          </div>
        </div>
      )}
    </>
  );
}
