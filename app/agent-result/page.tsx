"use client";

// 简配 2.0 · 结果页（国风研判报告）。读 sessionStorage 里的真 agent 输出渲染。
// 数据形状见 lib/agent-report.ts（镜像 lib/agents 节点）。不动已部署 MVP（app/result）。

import { useEffect, useState } from "react";
import Link from "next/link";
import { AGENT_REPORT_KEY, statusKind, type AgentReport } from "@/lib/agent-report";
import { JunshiChat } from "@/components/JunshiChat";

const GF_TEXTURE = {
  backgroundImage:
    "radial-gradient(rgba(74,57,32,0.05) 0.5px, transparent 0.6px), radial-gradient(rgba(74,57,32,0.045) 0.5px, transparent 0.6px), repeating-linear-gradient(7deg, rgba(74,57,32,0.02) 0, rgba(74,57,32,0.02) 1px, transparent 1px, transparent 4px)",
  backgroundSize: "4px 4px, 7px 6px, auto",
  backgroundPosition: "0 0, 2px 3px, 0 0"
};

const TONE: Record<"hit" | "partial" | "miss", string> = {
  hit: "text-gf-green",
  partial: "text-gf-amber",
  miss: "text-gf-seal"
};

function BambooTick() {
  return (
    <svg viewBox="0 0 10 18" width="9" height="16" aria-hidden className="shrink-0">
      <g fill="#52724b">
        <rect x="2" y="0" width="6" height="7" rx="2" />
        <rect x="2" y="9" width="6" height="9" rx="2" />
        <rect x="1" y="7.2" width="8" height="2" rx="1" />
      </g>
    </svg>
  );
}

function BambooShadow() {
  return (
    <svg
      viewBox="0 0 60 150"
      width="150"
      height="380"
      aria-hidden
      className="pointer-events-none fixed right-0 top-10 z-0"
      style={{ color: "#52724b", opacity: 0.08 }}
    >
      <g transform="rotate(7 30 75)" fill="currentColor">
        <rect x="26" y="10" width="7" height="26" rx="3" />
        <rect x="26" y="39" width="7" height="26" rx="3" />
        <rect x="26" y="68" width="7" height="26" rx="3" />
        <rect x="26" y="97" width="7" height="28" rx="3" />
        <rect x="24" y="35" width="11" height="3" rx="1.5" />
        <rect x="24" y="64" width="11" height="3" rx="1.5" />
        <rect x="24" y="93" width="11" height="3" rx="1.5" />
        <path d="M33 18 Q53 9 64 14 Q49 25 33 23 Z" />
        <path d="M33 29 Q49 29 58 40 Q44 40 33 32 Z" />
      </g>
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-9 flex items-center gap-2.5">
      <BambooTick />
      <h2 className="whitespace-nowrap font-serifcn text-[18px] font-semibold text-gf-ink">{children}</h2>
      <span className="h-px flex-1 bg-gf-rule" />
    </div>
  );
}

// 节节高判断尺：岗位定位（不是打分）。该绕开 < 跳板 < 目标，当前档高亮。
function Ladder({ tier }: { tier: string }) {
  const cols = [
    { name: "该绕开", meaning: "别浪费枪", h: 34, tone: "text-gf-seal" },
    { name: "跳板", meaning: "过渡练级", h: 54, tone: "text-gf-greend" },
    { name: "目标", meaning: "值得扎根", h: 74, tone: "text-gf-faint" }
  ];
  return (
    <div className="shrink-0">
      <div className="mb-2 text-center text-[11px] tracking-wide text-gf-faint">岗位定位 · 不是打分</div>
      <div className="flex items-end justify-center gap-4">
        {cols.map((c) => {
          const active = c.name === tier;
          return (
            <div key={c.name} className="flex flex-col items-center">
              <div className="flex h-20 flex-col items-center justify-end">
                {active && (
                  <>
                    <span className="mb-0.5 whitespace-nowrap text-[10px] text-gf-greend">你在此</span>
                    <span
                      className="mb-1"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: "5px solid #3a5436"
                      }}
                    />
                  </>
                )}
                <div
                  className="relative w-[22px] rounded"
                  style={{ height: c.h, background: active ? "#52724b" : "#cfdec6" }}
                >
                  <span
                    className="absolute rounded-sm"
                    style={{ left: -1, right: -1, top: "36%", height: 2.4, background: active ? "#34492f" : "#b6c9ab" }}
                  />
                  {active && (
                    <span
                      className="absolute rounded-sm"
                      style={{ left: -1, right: -1, top: "68%", height: 2.4, background: "#34492f" }}
                    />
                  )}
                </div>
              </div>
              <div className={`mt-1.5 font-serifcn text-[13px] ${active ? "font-medium text-gf-greend" : c.tone}`}>
                {c.name}
              </div>
              <div className="mt-0.5 text-[10.5px] text-gf-faint">{c.meaning}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AgentResultPage() {
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

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gf-paper px-6 text-center" style={GF_TEXTURE}>
        <div className="font-serifcn text-[22px] text-gf-ink">还没有研判结果</div>
        <p className="mt-2 text-[13px] text-gf-faint">先去喂一段 JD 和你的简历。</p>
        <Link
          href="/agent"
          className="mt-6 rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend"
        >
          去研判一个岗位 →
        </Link>
      </div>
    );
  }

  const { meta, jdAnalysis: jd, resumeEvidence: ev, matchJudgment: mj, actionPlan: plan } = report;
  const title = [meta.position, meta.company].filter(Boolean).join(" · ") || "岗位研判";
  const verdict = `${mj.tier}${mj.isBoundary ? " · 边界" : ""}`;
  const verdictColor = mj.tier === "该绕开" ? "text-gf-seal" : "text-gf-green";
  const cover = { hit: 0, partial: 0, miss: 0 };
  for (const g of mj.gaps) cover[statusKind(g.status)] += 1;

  return (
    <div className="relative min-h-screen scroll-smooth bg-gf-paper font-sans text-gf-ink" style={GF_TEXTURE}>
      <BambooShadow />

      <header className="sticky top-0 z-20 border-b border-gf-rule bg-gf-paper/90">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-serifcn text-[17px] font-semibold text-gf-ink">
              简<span className="text-gf-green">配</span>
            </span>
            <span className="text-gf-rule">|</span>
            <span className="truncate text-sm text-gf-soft">{title}</span>
          </div>
          <Link
            href="/agent"
            className="shrink-0 rounded-md border border-gf-rule px-3 py-1.5 text-xs text-gf-soft transition-colors hover:bg-gf-greentint"
          >
            换一个岗位
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[820px] px-6 py-10">
        <article>
          <header className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] font-medium tracking-wide text-gf-green">
              <BambooTick />
              求职军师 · 研判
            </div>
            <h1 className="font-serifcn text-[34px] font-semibold leading-tight tracking-tight text-gf-ink">{title}</h1>
            <div className="mt-2 text-[13px] text-gf-faint">基于你的简历与求职意图 · {meta.date}</div>
          </header>

          <section className="mb-5 rounded-xl border border-gf-rule bg-gf-surface p-5">
            <div className="flex flex-wrap items-start gap-6">
              <Ladder tier={mj.tier} />
              <div className="min-w-[240px] flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span className={`font-serifcn text-[26px] font-semibold ${verdictColor}`}>{verdict}</span>
                  <span className="rounded border border-gf-seal px-1.5 py-px font-serifcn text-[11px] text-gf-seal">研判</span>
                </div>
                {mj.reasoning && (
                  <p className="my-2.5 font-serifcn text-[15.5px] leading-snug">{mj.reasoning}</p>
                )}
                {mj.tradeoff && (
                  <div className="text-[13px] leading-relaxed text-gf-soft">
                    <strong className="text-gf-ink">取舍　</strong>
                    {mj.tradeoff}
                  </div>
                )}
                {mj.timeHint && (
                  <div className="mt-1 text-[13px] leading-relaxed text-gf-soft">
                    <strong className="text-gf-ink">时限　</strong>
                    {mj.timeHint}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gf-rule pt-3">
              <span className="text-[11px] tracking-wide text-gf-faint">匹配 · 支撑信号</span>
              <span className="text-[13px] text-gf-ink">
                硬性要求 {mj.gaps.length} 条 —— <span className="text-gf-green">● 命中 {cover.hit}</span>
                <span className="text-gf-amber">　● 部分 {cover.partial}</span>
                <span className="text-gf-seal">　● 缺 {cover.miss}</span>
              </span>
              <span className="text-[11px] text-gf-faint">明细见下方「逐条排雷」</span>
            </div>
          </section>

          {jd.realIdentity && (
            <section className="rounded-xl border border-gf-greentint bg-gf-greentint p-4">
              <div className="mb-1.5 text-[11px] font-medium tracking-wide text-gf-green">核心洞察 · JD 真身</div>
              <p className="font-serifcn text-[16px] leading-relaxed text-gf-ink">{jd.realIdentity}</p>
            </section>
          )}

          <section>
            <SectionHeading>JD 真身解读</SectionHeading>
            {jd.whoTheyWant && (
              <p className="mb-4 text-[14px]">
                <span className="font-serifcn text-gf-green">要什么人　</span>
                {jd.whoTheyWant}
              </p>
            )}
            {jd.signals.length > 0 && (
              <div className="divide-y divide-gf-rule border-y border-gf-rule">
                {jd.signals.map((s, i) => (
                  <div key={i} className="py-3.5">
                    <div className="font-serifcn text-[15px] text-gf-ink">「{s.fromText}」</div>
                    <div className="mt-1 text-[13.5px] leading-relaxed text-gf-soft">{s.reads}</div>
                  </div>
                ))}
              </div>
            )}
            {jd.infoGaps.length > 0 && (
              <>
                <div className="mb-1 mt-3 text-[12.5px] text-gf-faint">信息缺口（JD 没说，面试要问）</div>
                <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 text-[13px] leading-relaxed text-gf-soft">
                  {jd.infoGaps.map((g, i) => (
                    <li key={i}>· {g}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section>
            <SectionHeading>你的牌面</SectionHeading>
            {ev.summary && <p className="mb-4 text-[14px]">{ev.summary}</p>}
            {ev.evidences.length > 0 && (
              <div className="divide-y divide-gf-rule border-y border-gf-rule">
                {ev.evidences.map((e, i) => (
                  <div key={i} className="py-3.5">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-serifcn text-[14.5px] italic text-gf-ink">{e.source}</span>
                      <span className="text-[12px] text-gf-faint">{e.category}</span>
                    </div>
                    <div className="mt-1 text-[13.5px] text-gf-soft">→ {e.claim}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading>逐条排雷</SectionHeading>
            <div className="divide-y divide-gf-rule border-y border-gf-rule">
              {mj.gaps.map((g, i) => (
                <div key={i} className="flex flex-wrap items-baseline gap-x-3 py-3">
                  <span className="w-[120px] shrink-0 font-serifcn text-[15px] text-gf-ink">{g.need}</span>
                  <span className={`w-[44px] shrink-0 text-[12.5px] font-medium ${TONE[statusKind(g.status)]}`}>
                    {g.status}
                  </span>
                  <span className="min-w-[200px] flex-1 text-[13.5px] text-gf-soft">{g.note}</span>
                </div>
              ))}
            </div>

            {mj.warnings.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "#e6d3c3", background: "#f7ece1" }}>
                <div className="px-3.5 py-1.5 text-[11.5px] tracking-wide text-white" style={{ background: "#9c3b30" }}>
                  避雷 · 从 JD 嗅到的风险
                </div>
                <div className="px-4 py-3 text-[13px] leading-relaxed" style={{ color: "#5a4036" }}>
                  {mj.warnings.map((w, i) => (
                    <div key={i}>
                      {i + 1}　{w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mj.fork && (
              <div className="mt-3 rounded-xl border border-gf-rule bg-gf-surface p-3.5">
                <div className="mb-1.5 text-[11.5px] font-medium text-gf-green">条件分叉 · 取决于一个你还没定的选择</div>
                <p className="mb-2 font-serifcn text-[15px]">{mj.fork.dependsOn}</p>
                <div className="flex flex-wrap border-t border-gf-rule text-[13px] leading-relaxed">
                  <div className="min-w-[180px] flex-1 pr-3.5 pt-2">
                    <span className="font-medium text-gf-greend">若愿意　</span>
                    {mj.fork.ifYes}
                  </div>
                  <div className="min-w-[180px] flex-1 border-l border-gf-rule pl-3.5 pt-2">
                    <span className="font-medium text-gf-seal">若不愿　</span>
                    {mj.fork.ifNo}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <SectionHeading>应对策略</SectionHeading>
            {plan.resumeStrategy?.highlight && (
              <p className="mb-1.5 text-[14px]">
                <span className="font-serifcn text-gf-green">扬长　</span>
                {plan.resumeStrategy.highlight}
              </p>
            )}
            {plan.resumeStrategy?.downplay && (
              <p className="mb-4 text-[14px]">
                <span className="font-serifcn text-gf-green">避短　</span>
                {plan.resumeStrategy.downplay}
              </p>
            )}
            {plan.interviewTips.length > 0 && (
              <>
                <div className="mb-1 text-[12.5px] text-gf-faint">面试要点</div>
                <ol className="list-none space-y-1 text-[13.5px] leading-relaxed text-gf-soft">
                  {plan.interviewTips.map((t, i) => (
                    <li key={i}>
                      {["①", "②", "③", "④", "⑤"][i] ?? "·"} {t}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {plan.salaryTip && (
              <p className="mt-3 text-[13.5px]">
                <span className="font-serifcn text-gf-green">谈薪　</span>
                {plan.salaryTip}
              </p>
            )}
          </section>

          <footer className="mt-9 border-t border-gf-rule pt-3 text-[11px] leading-relaxed text-gf-faint">
            本研判基于公开 JD 文本与你提供的简历，不构成承诺；岗位定位由后端规则判定、稳定，匹配为逐条命中派生。AI 多次运行措辞或有轻微波动。— 不编造，可追溯。
          </footer>
        </article>
      </main>

      <JunshiChat report={report} />
    </div>
  );
}
