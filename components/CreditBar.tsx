"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CreditInfo = {
  used: number; left: number; daily: number; claimed: boolean;
  costs: Record<string, number>;
};

export function CreditBar() {
  const [info, setInfo] = useState<CreditInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const refresh = useCallback(() => {
    fetch("/api/credits").then(r => r.json()).then(setInfo).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function claim() {
    setClaiming(true);
    try {
      const res = await fetch("/api/credits/claim", { method: "POST" });
      const data = await res.json();
      if (res.ok) refresh();
      else alert(data.error ?? "领取失败");
    } catch {
      alert("网络错误，请重试。");
    } finally {
      setClaiming(false);
    }
  }

  if (!info) return null;

  const pct = Math.round((info.left / info.daily) * 100);
  const barColor = pct > 50 ? "bg-gf-green" : pct > 20 ? "bg-gf-amber" : "bg-gf-seal";

  // 下拉菜单位置：相对于按钮
  const btnRect = btnRef.current?.getBoundingClientRect();
  const dropdownStyle = btnRect ? {
    top: btnRect.bottom + 6,
    right: window.innerWidth - btnRect.right,
  } : { top: 48, right: 12 };

  return (
    <>
      <button
        ref={btnRef}
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

      {/* 额度下拉 —— Portal 到 body，避免被 AppShell overflow/z-index 裁剪 */}
      {mounted && open && createPortal(
        <>
          {/* 点击空白关闭 */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] w-64 rounded-lg border border-gf-rule bg-gf-surface p-3 shadow-lg"
            style={{ top: dropdownStyle.top, right: dropdownStyle.right }}
          >
            <p className="mb-2 text-[12px] font-medium text-gf-ink">
              今日额度 · 每天 0 点重置
              {info.claimed && <span className="ml-1 text-gf-green">（已领取 10 点）</span>}
            </p>

            <div className="mb-3 space-y-0.5 text-[11px] text-gf-soft">
              <div className="flex justify-between"><span>🕵 研判分析</span><span className="text-gf-ink">{info.costs.analyze} 点/次</span></div>
              <div className="flex justify-between"><span>📸 图片简历</span><span className="text-gf-ink">{info.costs.image} 点/次</span></div>
              <div className="flex justify-between"><span>🗺 职业规划</span><span className="text-gf-ink">{info.costs.career} 点/次</span></div>
              <div className="flex justify-between"><span>🔍 背调/岗位调查</span><span className="text-gf-ink">{info.costs.recon} 点/次</span></div>
              <div className="flex justify-between"><span>💬 军师/小简对话</span><span className="text-gf-ink">{info.costs.chat} 点/条</span></div>
              <div className="flex justify-between"><span>📝 简历整理</span><span className="text-gf-ink">{info.costs.structure} 点/次</span></div>
              <div className="flex justify-between"><span>📄 文件解析</span><span className="text-gf-faint">免费</span></div>
              <div className="flex justify-between"><span>📥 导出</span><span className="text-gf-faint">免费</span></div>
            </div>

            {!info.claimed ? (
              <button
                type="button"
                onClick={claim}
                disabled={claiming}
                className="mb-2 w-full rounded-md bg-gf-greend px-3 py-2 text-[13px] text-white transition-colors hover:bg-gf-green disabled:opacity-50"
              >
                {claiming ? "领取中…" : "🎁 免费领 10 点（每日一次）"}
              </button>
            ) : (
              <p className="mb-2 text-center text-[11px] text-gf-faint">今日已领取，明天再来。</p>
            )}

            <button
              type="button"
              onClick={() => { setOpen(false); setShowRecharge(true); }}
              className="w-full rounded-md border border-gf-rule px-3 py-2 text-[13px] text-gf-soft transition-colors hover:bg-gf-greentint/30"
            >
              🔋 需要更多额度？了解充值 →
            </button>
          </div>
        </>,
        document.body
      )}

      {/* 充值弹窗 —— Portal 到 body，固定屏幕居中 */}
      {mounted && showRecharge && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gf-ink/40" onClick={() => setShowRecharge(false)}>
          <div className="mx-4 w-full max-w-sm rounded-xl border border-gf-rule bg-gf-surface p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-serifcn text-[18px] font-semibold text-gf-ink">充值额度</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-gf-soft">
              简配目前完全免费。每天的 25 点 + 领取 10 点（共 35 点）足够日常使用。
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-gf-soft">
              付费方案即将推出——如果你是重度用户、需要更多研判次数，欢迎联系作者反馈需求。
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRecharge(false)}
                className="flex-1 rounded-lg bg-gf-green px-4 py-2.5 font-serifcn text-[14px] text-white transition-colors hover:bg-gf-greend"
              >
                知道了
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
