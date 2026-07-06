"use client";

// 简配 2.0 · 研判页（国风研判报告，装进 AppShell）。读 sessionStorage 里的真 agent 输出。
// 治累：判定精简成一屏焦点、取舍/时限拎出小节、逐条走国风细线表、分块留白呼吸。
// 质感：淡竹影 + 朱印；无斜体。加载时把这次研判存进本地历史。不动已部署 MVP。

import { useEffect, useState } from "react";
import Link from "next/link";
import { AGENT_REPORT_KEY, statusKind, type AgentReport } from "@/lib/agent-report";
import { saveToHistory } from "@/lib/history";
import { JunshiChat } from "@/components/JunshiChat";
import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";

const GF_TEXTURE = {
  backgroundImage:
    "radial-gradient(rgba(74,57,32,0.05) 0.5px, transparent 0.6px), radial-gradient(rgba(74,57,32,0.045) 0.5px, transparent 0.6px)",
  backgroundSize: "4px 4px, 7px 6px",
  backgroundPosition: "0 0, 2px 3px"
};

const TONE: Record<"hit" | "partial" | "miss", string> = {
  hit: "text-gf-green",
  partial: "text-gf-amber",
  miss: "text-gf-seal"
};

function Tick() {
  return <span className="inline-block h-3 w-[5px] shrink-0 rounded-[2px] bg-gf-green" aria-hidden />;
}

// 朱印小章：朱红边、宋体、微旋，国风盖印感。
function SealStamp({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] border border-gf-seal px-1.5 py-0.5 font-serifcn text-[11px] text-gf-seal"
      style={{ transform: "rotate(-3deg)", letterSpacing: "1.5px" }}
    >
      {children}
    </span>
  );
}

// 角落淡竹影，国风留白里的呼吸。
function BambooShade() {
  return (
    <svg viewBox="0 0 90 220" className="pointer-events-none absolute right-0 top-48 hidden h-80 w-28 lg:block" style={{ color: "#52724b", opacity: 0.05 }} aria-hidden>
      <g transform="rotate(8 45 110)" fill="currentColor">
        <rect x="40" y="10" width="8" height="36" rx="4" />
        <rect x="40" y="50" width="8" height="38" rx="4" />
        <rect x="40" y="92" width="8" height="36" rx="4" />
        <rect x="40" y="132" width="8" height="38" rx="4" />
        <rect x="37" y="46" width="14" height="4" rx="2" />
        <rect x="37" y="88" width="14" height="4" rx="2" />
        <rect x="37" y="128" width="14" height="4" rx="2" />
        <path d="M48 24 Q72 14 88 20 Q66 33 48 30 Z" />
        <path d="M48 64 Q70 64 82 78 Q60 78 48 68 Z" />
        <path d="M48 104 Q72 96 90 102 Q68 113 48 108 Z" />
      </g>
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 mt-10 flex items-center gap-2.5">
      <Tick />
      <h2 className="whitespace-nowrap font-serifcn text-[18px] font-semibold text-gf-ink">{children}</h2>
      <span className="h-px flex-1 bg-gf-rule" />
    </div>
  );
}

// 节节高判断尺：岗位定位（不是打分）。真·竹节——该绕开 1 节 / 跳板 2 节 / 目标 3 节，
// 节数与每节尺寸全固定（不按比例画高度，渲染永远一致），当前档整列高亮。
function Ladder({ tier }: { tier: string }) {
  const cols = [
    { name: "该绕开", meaning: "不建议去", segs: 1, tone: "text-gf-seal" },
    { name: "跳板", meaning: "过渡练级", segs: 2, tone: "text-gf-greend" },
    { name: "目标", meaning: "值得扎根", segs: 3, tone: "text-gf-faint" }
  ];
  return (
    <div className="shrink-0">
      <div className="mb-2 text-center text-[11px] tracking-wide text-gf-faint">岗位定位 · 不是打分</div>
      <div className="flex items-end justify-center gap-3.5">
        {cols.map((c) => {
          const active = c.name === tier;
          return (
            <div key={c.name} className="flex flex-col items-center">
              <div className="flex h-[82px] flex-col items-center justify-end">
                {active && <span className="mb-1 whitespace-nowrap text-[11px] text-gf-greend">你在此</span>}
                {/* 一根连续竹竿(不是积木):每节固定 20px,节与节之间一道竹节线 */}
                <div
                  className="relative w-[20px] rounded-[5px]"
                  style={{ height: c.segs * 20, background: active ? "#3a5436" : "#cfdec6" }}
                >
                  {Array.from({ length: c.segs - 1 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute rounded-sm"
                      style={{ left: -1, right: -1, top: (i + 1) * 20 - 1, height: 2, background: active ? "#2c4128" : "#b6c9ab" }}
                    />
                  ))}
                </div>
              </div>
              <div className={`mt-1.5 font-serifcn text-[12px] ${active ? "font-medium text-gf-greend" : c.tone}`}>{c.name}</div>
              <div className="mt-0.5 text-[11px] text-gf-faint">{c.meaning}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 取舍 / 时限小节。flex 自适应：时限空时取舍占满整行，不留刺眼空列。
function SubNote({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="min-w-[240px] flex-1">
      <div className="mb-1 flex items-center gap-2">
        <Tick />
        <span className="font-serifcn text-[14px] font-semibold text-gf-ink">{label}</span>
      </div>
      <p className="pl-[15px] text-[14px] leading-relaxed text-gf-soft">{text}</p>
    </div>
  );
}

function VerdictView({ report }: { report: AgentReport }) {
  const { meta, jdAnalysis: jd, resumeEvidence: ev, matchJudgment: mj, actionPlan: plan } = report;
  const title = [meta.position, meta.company].filter(Boolean).join(" · ") || "岗位研判";
  const verdict = `${mj.tier}${mj.isBoundary ? " · 边界" : ""}`;
  const verdictColor = mj.tier === "该绕开" ? "text-gf-seal" : "text-gf-greend";
  const cover = { hit: 0, partial: 0, miss: 0 };
  for (const g of mj.gaps) cover[statusKind(g.status)] += 1;

  return (
    <div className="gf-rise relative mx-auto max-w-[760px] px-5 py-9 font-serifcn sm:px-8" style={GF_TEXTURE}>
      <BambooShade />

      {/* 顶栏:墨绿头版(与「研判新岗位」按钮同族),裁决章直接落在头版上 */}
      <header className="relative z-10 mb-7 overflow-hidden rounded-2xl bg-gf-greend px-6 py-5">
        <div className="text-[12px] tracking-[0.3em] text-[#b9d0af]">求职军师 · 研判</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="font-serifcn text-[28px] font-semibold leading-tight tracking-tight text-[#f2efe6]">{title}</h1>
          <span
            className="rounded-[6px] border-[1.5px] border-[#d47f6e] px-3 py-1 font-serifcn text-[18px] tracking-[0.2em] text-[#f0c0b4]"
            style={{ transform: "rotate(-3deg)" }}
          >
            {verdict}
          </span>
        </div>
        <div className="mt-1.5 text-[12px] text-[#f2efe6]/55">基于你的简历与求职意图 · {meta.date}</div>
      </header>

      {/* 判定 · 一屏焦点 */}
      <section className="relative z-10 overflow-hidden rounded-xl border border-gf-rule bg-gf-surface p-5">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <Ladder tier={mj.tier} />
          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className={`font-serifcn text-[18px] font-semibold ${verdictColor}`}>{verdict}</span>
              <SealStamp>研判</SealStamp>
            </div>
            <div className="mb-1 text-[12px] tracking-wide text-gf-faint">为什么这么判</div>
            {mj.reasoning && <p className="font-serifcn text-[15px] leading-relaxed text-gf-ink">{mj.reasoning}</p>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gf-rule pt-3 text-[14px]">
          <span className="text-[11px] tracking-wide text-gf-faint">{mj.gaps.length} 条硬要求 · 你对上几条</span>
          <span className="text-gf-green">● 命中 {cover.hit}</span>
          <span className="text-gf-amber">● 部分 {cover.partial}</span>
          <span className="text-gf-seal">● 缺 {cover.miss}</span>
        </div>
      </section>

      {/* 公司 · 业务线推断(①的侦探推理;不装作知道:显式标注推断非确定) */}
      {jd.orgGuess && jd.orgGuess.candidates.length > 0 && (
        <section className="relative z-10 mt-6 rounded-xl border border-gf-rule bg-gf-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tick />
            <span className="font-serifcn text-[14px] font-semibold text-gf-ink">这份 JD 可能来自谁</span>
            <span className="text-[12px] text-gf-faint">推断 · 非确定</span>
          </div>
          <div className="space-y-3">
            {jd.orgGuess.candidates.map((c, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serifcn text-[14px] text-gf-ink">{c.name}</span>
                  <span className="text-[12px] font-medium text-gf-greend">{Math.round(c.prob)}%</span>
                </div>
                <div className="mt-1 h-[5px] overflow-hidden rounded bg-gf-greentint">
                  <div
                    className="h-full rounded"
                    style={{ width: `${Math.min(100, Math.max(0, c.prob))}%`, background: "#52724b" }}
                  />
                </div>
                <div className="mt-1 text-[12px] leading-relaxed text-gf-soft">{c.why}</div>
              </div>
            ))}
          </div>
          {jd.orgGuess.note && (
            <div className="mt-3 border-t border-gf-rule pt-2 text-[12px] text-gf-faint">{jd.orgGuess.note}</div>
          )}
        </section>
      )}

      {/* 取舍 / 时限 · 时限空时取舍自动占满 */}
      {(mj.tradeoff || mj.timeHint) && (
        <div className="relative z-10 mt-6 flex flex-wrap gap-x-10 gap-y-4">
          <SubNote label="取舍" text={mj.tradeoff} />
          <SubNote label="时限" text={mj.timeHint} />
        </div>
      )}

      {/* 核心洞察 */}
      {jd.realIdentity && (
        <section className="relative z-10 mt-6 rounded-xl border border-gf-rule bg-gf-surface p-4">
          <div className="mb-1.5 text-[11px] font-medium tracking-wide text-gf-green">一句话看穿这个岗</div>
          <p className="font-serifcn text-[15px] leading-relaxed text-gf-ink">{jd.realIdentity}</p>
        </section>
      )}

      <div className="relative z-10">
        {/* JD 真身解读 */}
        <section>
          <SectionHeading>这岗到底要什么人</SectionHeading>
          {jd.whoTheyWant && (
            <p className="mb-4 text-[14px] leading-relaxed">
              <span className="font-serifcn text-gf-green">要什么人　</span>
              {jd.whoTheyWant}
            </p>
          )}
          {jd.signals.length > 0 && (
            <div className="divide-y divide-gf-rule border-y border-gf-rule">
              {jd.signals.map((s, i) => (
                <div key={i} className="py-3.5">
                  <div className="font-serifcn text-[14px] text-gf-ink">「{s.fromText}」</div>
                  <div className="mt-1 text-[14px] leading-relaxed text-gf-soft">{s.reads}</div>
                </div>
              ))}
            </div>
          )}
          {jd.infoGaps.length > 0 && (
            <>
              <p className="mb-1.5 mt-4 text-[14px]">
                <span className="font-serifcn text-gf-green">信息缺口　</span>
                <span className="text-[12px] text-gf-faint">JD 没说，面试要问</span>
              </p>
              <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 text-[14px] leading-relaxed text-gf-soft">
                {jd.infoGaps.map((g, i) => (
                  <li key={i}>· {g}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* 你的牌面 */}
        <section>
          <SectionHeading>你的牌面</SectionHeading>
          {ev.summary && <p className="mb-4 text-[14px] leading-relaxed">{ev.summary}</p>}
          {ev.evidences.length > 0 && (
            <div className="divide-y divide-gf-rule border-y border-gf-rule">
              {ev.evidences.map((e, i) => (
                <div key={i} className="py-3">
                  {/* 人话在前:这条证据说明什么;原文降为小字引注(去机器腔) */}
                  <div className="text-[14px] leading-relaxed text-gf-ink">{e.claim}</div>
                  <div className="mt-1 flex items-baseline gap-x-2 text-[12px] text-gf-faint">
                    <span className="shrink-0">{e.category}</span>
                    <span className="min-w-0 truncate">「{e.source}」</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 逐条对照 · 细线表(改名:这是硬性要求对账,不是排雷;判定列拉开距离防黏连) */}
        <section>
          <SectionHeading>逐条对照</SectionHeading>
          <div className="text-[14px]">
            <div className="flex gap-x-4 border-b border-gf-rule py-2 text-[11px] tracking-wide text-gf-faint">
              <span className="w-[150px] shrink-0">JD 要求</span>
              <span className="w-[36px] shrink-0 text-center">判定</span>
              <span className="flex-1">说明</span>
            </div>
            {mj.gaps.map((g, i) => (
              <div key={i} className="flex gap-x-4 border-b border-gf-rule py-3">
                <span className="w-[150px] shrink-0 font-serifcn text-[14px] leading-relaxed text-gf-ink">{g.need}</span>
                <span className={`w-[36px] shrink-0 pt-0.5 text-center text-[12px] font-medium ${TONE[statusKind(g.status)]}`}>
                  {g.status}
                </span>
                <span className="flex-1 text-[14px] leading-relaxed text-gf-soft">{g.note}</span>
              </div>
            ))}
          </div>

          {mj.warnings.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border" style={{ borderColor: "#e6d3c3", background: "#f7ece1" }}>
              <div className="px-3.5 py-1.5 text-[12px] tracking-wide text-white" style={{ background: "#9c3b30" }}>
                提个醒 · 这岗的坑
              </div>
              <div className="px-4 py-3 text-[14px] leading-relaxed" style={{ color: "#5a4036" }}>
                {mj.warnings.map((w, i) => (
                  <div key={i}>{i + 1}　{w}</div>
                ))}
              </div>
            </div>
          )}

          {mj.fork && (
            <div className="mt-3 rounded-xl border border-gf-rule bg-gf-surface p-3.5">
              <div className="mb-1.5 text-[12px] font-medium text-gf-green">条件分叉 · 取决于一个你还没定的选择</div>
              <p className="mb-2 font-serifcn text-[15px]">{mj.fork.dependsOn}</p>
              <div className="flex flex-wrap gap-y-2 border-t border-gf-rule pt-2 text-[14px] leading-relaxed">
                <div className="min-w-[180px] flex-1 pr-3.5">
                  <span className="font-medium text-gf-greend">若愿意　</span>
                  {mj.fork.ifYes}
                </div>
                <div className="min-w-[180px] flex-1 pl-3.5">
                  <span className="font-medium text-gf-seal">若不愿　</span>
                  {mj.fork.ifNo}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 应对策略 */}
        <section>
          <SectionHeading>应对策略</SectionHeading>
          {plan.resumeStrategy?.highlight && (
            <p className="mb-1.5 text-[14px] leading-relaxed">
              <span className="font-serifcn text-gf-green">扬长　</span>
              {plan.resumeStrategy.highlight}
            </p>
          )}
          {plan.resumeStrategy?.downplay && (
            <p className="mb-4 text-[14px] leading-relaxed">
              <span className="font-serifcn text-gf-green">避短　</span>
              {plan.resumeStrategy.downplay}
            </p>
          )}
          {plan.interviewTips.length > 0 && (
            <>
              <p className="mb-1.5 text-[14px]">
                <span className="font-serifcn text-gf-green">面试要点</span>
              </p>
              <ol className="list-none space-y-1 text-[14px] leading-relaxed text-gf-soft">
                {plan.interviewTips.map((t, i) => (
                  <li key={i}>{["①", "②", "③", "④", "⑤"][i] ?? "·"} {t}</li>
                ))}
              </ol>
            </>
          )}
          {plan.interviewFocus?.length > 0 && (
            <div className="mt-4 rounded-lg border border-gf-rule bg-gf-surface/50 p-3.5">
              <p className="mb-2.5 text-[13px] font-medium text-gf-ink">面试考点比重（根据 JD 信号推断）</p>
              <div className="space-y-2">
                {plan.interviewFocus.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gf-green" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] text-gf-ink">{f.area}</span>
                        <span className="text-[12px] text-gf-green">≈{f.weight}%</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {/* 比重条 */}
                        <div className="h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-gf-rule">
                          <div className="h-full rounded-full bg-gf-green/60" style={{ width: `${Math.min(f.weight, 100)}%` }} />
                        </div>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-gf-faint">{f.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {plan.salaryTip && (
            <p className="mt-3 text-[14px] leading-relaxed">
              <span className="font-serifcn text-gf-green">谈薪　</span>
              {plan.salaryTip}
            </p>
          )}
        </section>

        <div className="mt-10 rounded-xl border border-gf-rule bg-gf-surface/50 p-4">
          <div className="mb-2.5 text-[12px] text-gf-faint">看完研判,接下来想干嘛——</div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/resume" className="rounded-lg border border-gf-rule bg-gf-paper px-3.5 py-2 font-serifcn text-[14px] text-gf-soft transition-all duration-200 hover:border-gf-green hover:text-gf-greend">照着改简历 →</Link>
            <Link href="/career" className="rounded-lg border border-gf-rule bg-gf-paper px-3.5 py-2 font-serifcn text-[14px] text-gf-soft transition-all duration-200 hover:border-gf-green hover:text-gf-greend">跟小简聊聊方向 →</Link>
          </div>
        </div>

        <footer className="mt-10 border-t border-gf-rule pt-3 text-[11px] leading-relaxed text-gf-faint">
          本研判基于公开 JD 文本与你提供的简历，不构成承诺；岗位定位由后端规则判定、稳定，匹配为逐条命中派生。AI 多次运行措辞或有轻微波动。— 不编造，可追溯。
        </footer>
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
      if (raw) {
        const r = JSON.parse(raw) as AgentReport;
        setReport(r);
        saveToHistory(r);
      }
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!report) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gf-paper px-6 text-center" style={GF_TEXTURE}>
        <div className="font-serifcn text-[22px] text-gf-ink">还没有研判结果</div>
        <p className="mt-2 text-[14px] text-gf-faint">先去喂一段 JD 和你的简历。</p>
        <Link
          href="/agent"
          className="mt-6 rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend"
        >
          去研判一个岗位 →
        </Link>
      </div>
    );
  }

  const title = [report.meta.position, report.meta.company].filter(Boolean).join(" · ") || "岗位研判";

  return (
    <AppShell
      brand={<span className="truncate text-[14px] text-gf-soft">{title}</span>}
      nav={<AppNav />}
      aside={<JunshiChat report={report} embedded />}
    >
      <VerdictView report={report} />
    </AppShell>
  );
}
