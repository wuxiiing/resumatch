"use client";

// 简配 2.0 · 输入页(P3 竹林重做)。一个玻璃对话框收所有输入——文字 / 文件 / 截图,
// 槽位填充:缺简历问简历、缺 JD 问 JD,两样齐了亮出「开始研判」朱印。
// 背景:嵯峨野竹径运镜视频(/bamboo/intro.mp4 + /bamboo/poster.png);
// 素材未就位时用竹青渐变兜底,页面不破相。视差 + 落叶是网页层动效(reduced-motion 时静止)。
// 不动已部署 MVP(app/page.tsx);研判契约与旧版一致。

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadHistory, openHistoryItem, type HistoryItem } from "@/lib/history";
import {
  AGENT_REPORT_KEY,
  JIANPEI_PROFILE_KEY,
  type AgentReport,
  type JianpeiProfile
} from "@/lib/agent-report";
import { nextIntakeStep } from "@/lib/agents/intake-steps";
import type { StructuredResume } from "@/lib/resume-structured";

const STAGES = ["① 看穿 JD 真身", "② 提取简历证据", "③ 立体匹配研判", "④ 生成应对策略"];

type Msg = { id: number; role: "agent" | "user"; text: string };

// 结构化简历摊平成纯文本(研判管道吃文本)
function flattenResume(r: StructuredResume): string {
  const L: string[] = [];
  if (r.name) L.push(r.name);
  if (r.headline) L.push(r.headline);
  if (r.contacts.length) L.push(r.contacts.join(" · "));
  for (const s of r.sections) {
    L.push(`\n【${s.title}】`);
    for (const e of s.entries) {
      const head = [e.heading, e.meta].filter(Boolean).join(" · ");
      if (head) L.push(head);
      for (const b of e.bullets) L.push(`- ${b}`);
    }
  }
  return L.join("\n");
}

// 上传前压图(≤1024px, jpeg 0.7):省豆包 token+提速，Vercel 60s 上限内完成
async function imageFileToDataUrl(file: File, maxSide = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, err) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => err(new Error("图片读取失败"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持图片处理");
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AgentInputPage() {
  const router = useRouter();
  // ── 槽位 ──
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [goal, setGoal] = useState("");
  const hardNoRef = useRef<string[]>([]); // 老档案里的"绝不接受",原样保留回写
  const careerInviteRef = useRef(false); // 上次 agent 消息是规划邀请 → 渲染按钮
  // ── 对话 ──
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [intaking, setIntaking] = useState(false);
  const msgIdRef = useRef(1);
  const lastAgentRef = useRef("");
  const chatRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // ── 研判 ──
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  // ── 视觉 ──
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [lastEntry, setLastEntry] = useState<null | { kind: "session" } | { kind: "history"; item: HistoryItem }>(null);

  // 右上「上次研判」门:误跳回输入页不用重跑一遍
  useEffect(() => {
    try {
      if (sessionStorage.getItem(AGENT_REPORT_KEY)) {
        setLastEntry({ kind: "session" });
        return;
      }
      const h = loadHistory();
      if (h.length > 0) setLastEntry({ kind: "history", item: h[0] });
    } catch {
      /* ignore */
    }
  }, []);
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);

  function pushMsg(role: Msg["role"], text: string) {
    if (role === "agent") lastAgentRef.current = text;
    setMsgs((m) => [...m, { id: msgIdRef.current++, role, text }]);
  }

  // 槽位更新 + 确认语 + 下一步追问(缺啥问啥)
  function applyIntake(u: {
    resume?: string;
    resumeName?: string;
    jdText?: string;
    goalText?: string;
    confirm?: string;
  }) {
    const nextResume = u.resume ?? resumeText;
    const nextJd = u.jdText ?? jd;
    if (u.resume !== undefined) {
      setResumeText(u.resume);
      setResumeName(u.resumeName || "");
    }
    if (u.jdText !== undefined) setJd(u.jdText);
    if (u.goalText) setGoal(u.goalText);
    if (u.confirm) pushMsg("agent", u.confirm);
    const step = nextIntakeStep({ hasResume: !!nextResume.trim(), hasJd: !!nextJd.trim() });
    const follow = step.ready ? "简历、岗位都齐了。落印,开始研判。" : step.ask;
    if (follow && follow !== lastAgentRef.current) pushMsg("agent", follow);
  }

  // 开场:载入本地档案(记忆),按槽位状态开口
  useEffect(() => {
    let loadedResume = "";
    let loadedName = "";
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as JianpeiProfile;
        if (p.resumeText) {
          loadedResume = p.resumeText;
          loadedName = p.resumeName || "上回的简历";
          setResumeText(p.resumeText);
          setResumeName(loadedName);
        }
        if (p.intent) {
          setGoal(p.intent.targetDirection || "");
          hardNoRef.current = p.intent.hardNo || [];
        }
      }
    } catch {
      /* 档案损坏就当没有 */
    }
    if (loadedResume) pushMsg("agent", `简历还替你收着(${loadedName})。`);
    const step = nextIntakeStep({ hasResume: !!loadedResume, hasJd: false });
    pushMsg("agent", step.ask);
  }, []);

  // 简历/意图变化 → 回写本地档案
  useEffect(() => {
    if (!resumeText.trim()) return;
    try {
      localStorage.setItem(
        JIANPEI_PROFILE_KEY,
        JSON.stringify({
          resumeText,
          resumeName,
          intent: { targetDirection: goal.trim(), hardNo: hardNoRef.current }
        } satisfies JianpeiProfile)
      );
    } catch {
      /* 存不了也不挡 */
    }
  }, [resumeText, resumeName, goal]);

  // 对话自动滚到底
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // 标题浮现:视频"回正"时刻(~2.4s);视频缺席就 1.4s 兜底
  useEffect(() => {
    const t = setTimeout(() => setShowTitle(true), videoOk ? 2400 : 1400);
    return () => clearTimeout(t);
  }, [videoOk]);

  // 落叶 + 鼠标视差(网页层动效;reduced-motion 时不动)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = heroRef.current;
    const leavesBox = leavesRef.current;
    if (!hero || !leavesBox) return;
    type Leaf = { el: HTMLDivElement; x: number; y: number; sp: number; amp: number; ph: number; rot: number; rs: number };
    const leaves: Leaf[] = [];
    // 竹叶:细长披针形、竹青偏黄绿(不是圆片橙叶)
    const palette = ["#9fb968", "#b7c47c", "#c9cf8f", "#a8b06b"];
    const H = () => hero.clientHeight;
    const W = () => hero.clientWidth;
    if (!reduce) {
      for (let i = 0; i < 16; i++) {
        const el = document.createElement("div");
        const len = 18 + Math.random() * 14;
        const c = palette[(Math.random() * palette.length) | 0];
        el.innerHTML = `<svg width="${len.toFixed(0)}" height="${(len * 0.28).toFixed(0)}" viewBox="0 0 40 11" fill="none" aria-hidden="true"><path d="M1.5 5.5 Q 11 0.5 38.5 5.5 Q 11 10.5 1.5 5.5 Z" fill="${c}"/></svg>`;
        el.style.cssText = `position:absolute;top:0;left:0;opacity:${(0.45 + Math.random() * 0.35).toFixed(2)};will-change:transform;pointer-events:none;`;
        leavesBox.appendChild(el);
        leaves.push({
          el,
          x: Math.random() * W(),
          y: Math.random() * H() - H() * 0.4,
          sp: 0.3 + Math.random() * 0.6,
          amp: 14 + Math.random() * 30,
          ph: Math.random() * 6.28,
          rot: Math.random() * 360,
          rs: -0.4 + Math.random() * 0.8
        });
      }
    }
    let tx = 0, ty = 0, cx = 0, cy = 0, t = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    const frame = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (bgRef.current)
        bgRef.current.style.transform = `translate(${(cx * 10).toFixed(2)}px, ${(cy * 6).toFixed(2)}px) scale(1.07)`;
      if (!reduce) {
        t += 0.016;
        for (const o of leaves) {
          o.y += o.sp;
          o.rot += o.rs;
          const dx = Math.sin(t + o.ph) * o.amp + cx * 16;
          o.el.style.transform = `translate(${(o.x + dx).toFixed(1)}px, ${o.y.toFixed(1)}px) rotate(${o.rot.toFixed(1)}deg)`;
          if (o.y > H() + 24) {
            o.y = -24;
            o.x = Math.random() * W();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      leaves.forEach((o) => o.el.remove());
    };
  }, []);

  // ── 文字入场:分诊 → 填槽 ──
  async function handleSend() {
    const text = draft.trim();
    if (!text || intaking || loading) return;
    setDraft("");
    pushMsg("user", text.length > 140 ? `${text.slice(0, 140)}…` : text);
    setIntaking(true);
    try {
      // 规划意图识别：有简历无JD + 关键词匹配 → 直接引去职业规划
      const careerIntent = /帮(我|忙).{0,3}(定|看|选|找).{0,3}(方向|规划|适合|能做什么|往哪)|没有.{0,3}(岗位|jd|方向|目标)|不做研判|职业规划/.test(text);
      if (careerIntent && resumeText.trim() && !jd.trim()) {
        careerInviteRef.current = true;
        pushMsg("agent", "没有岗位也能聊。去小简那——把你简历摊开，看看能往哪些方向走。");
        setIntaking(false);
        return;
      }
      careerInviteRef.current = false;
      const res = await fetch("/api/intake-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "识别失败");
      if (data.kind === "jd") {
        applyIntake({ jdText: text, goalText: data.goal || undefined, confirm: "岗位已阅,全文入卷。" });
      } else if (data.kind === "resume") {
        applyIntake({ resume: text, resumeName: "粘贴的简历", confirm: "简历正文已收。" });
      } else if (data.kind === "goal") {
        applyIntake({ goalText: data.goal || text, confirm: `记下了:${data.goal || text}。` });
      } else {
        pushMsg("agent", "这个咱们研判完慢慢聊——先把简历或目标岗位给我,缺哪样我问哪样。");
      }
    } catch (e) {
      pushMsg("agent", `出了点问题:${e instanceof Error ? e.message : "识别失败"}。再发一次?`);
    } finally {
      setIntaking(false);
    }
  }

  // ── 文件/截图入场:图片走豆包视觉,文档走原解析 → 分诊 ──
  async function handleFile(file: File) {
    if (intaking || loading) return;
    pushMsg("user", `〔${file.name}〕`);
    setIntaking(true);
    try {
      if (file.type.startsWith("image/")) {
        const imageDataUrl = await imageFileToDataUrl(file);
        const res = await fetch("/api/extract-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "图片解析失败");
        if (data.kind === "resume") {
          applyIntake({
            resume: flattenResume(data.resume as StructuredResume),
            resumeName: file.name,
            confirm: `简历(图)已读:${(data.resume as StructuredResume).name || "识别成功"} · ${
              (data.resume as StructuredResume).sections.length
            } 个板块。`
          });
        } else if (data.kind === "jd") {
          applyIntake({ jdText: data.jdText as string, confirm: "岗位截图已读,全文入卷。" });
        } else {
          pushMsg("agent", `这张图看着是:${data.note || "别的东西"}。给我简历或岗位截图就行。`);
        }
      } else {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.text) throw new Error(data.error || "文件解析失败");
        // 文档多半是简历,但也可能是存成文件的 JD。先用文件名给个确定信号
        // (防 intake-text 分诊瞬时失败时把 JD 误当简历),再让分诊来纠正。
        const nameLooksLikeJd = /jd|job|岗位|招聘|职位|职务/i.test(file.name);
        let kind: "resume" | "jd" = nameLooksLikeJd ? "jd" : "resume";
        try {
          const c = await fetch("/api/intake-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: (data.text as string).slice(0, 4000) })
          });
          const cd = await c.json();
          if (c.ok && cd.kind === "jd") kind = "jd";
          else if (c.ok && cd.kind === "resume") kind = "resume"; // 分诊明确说简历,盖过文件名误报
        } catch {
          /* 分诊失败:沿用文件名判断,不再一律当简历 */
        }
        if (kind === "jd") applyIntake({ jdText: data.text, confirm: `〔${file.name}〕读完了——是份岗位描述,已入卷。` });
        else applyIntake({ resume: data.text, resumeName: file.name, confirm: `〔${file.name}〕已收入案头。` });
      }
    } catch (e) {
      pushMsg("agent", `出了点问题:${e instanceof Error ? e.message : "解析失败"}。换个文件或重试?`);
    } finally {
      setIntaking(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── 换料:点小票 ✕ 撤下重丢 ──
  function clearResume() {
    setResumeText("");
    setResumeName("");
    try {
      localStorage.setItem(
        JIANPEI_PROFILE_KEY,
        JSON.stringify({
          resumeText: "",
          resumeName: "",
          intent: { targetDirection: goal.trim(), hardNo: hardNoRef.current }
        } satisfies JianpeiProfile)
      );
    } catch {
      /* 存不了也不挡 */
    }
    pushMsg("agent", "旧简历已撤下。把新简历给我——文件、截图、粘贴都行。");
  }
  function clearJd() {
    setJd("");
    pushMsg("agent", "岗位已撤。丢下一份 JD 来——截图或全文粘贴。");
  }
  function clearGoal() {
    setGoal("");
  }

  // ── 研判(契约与旧版一致)──
  async function analyze() {
    if (loading) return;
    setLoading(true);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 12000);
    try {
      const res = await fetch("/api/agent-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription: jd,
          userIntent: { targetDirection: goal.trim(), hardNo: hardNoRef.current }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "分析失败,请重试");
      const report: AgentReport = {
        // 岗位名由 ① 从 JD 自动认出（研判自动命名）；公司不猜——推断放报告里带概率呈现
        meta: {
          position: typeof data.jdAnalysis?.jobTitle === "string" ? data.jdAnalysis.jobTitle : "",
          company: "",
          date: new Date().toISOString().slice(0, 10)
        },
        jdAnalysis: data.jdAnalysis,
        resumeEvidence: data.resumeEvidence,
        matchJudgment: data.matchJudgment,
        actionPlan: data.actionPlan
      };
      sessionStorage.setItem(AGENT_REPORT_KEY, JSON.stringify(report));
      router.push("/agent-result");
    } catch (e) {
      pushMsg("agent", `${e instanceof Error ? e.message : "分析失败,请重试"}`);
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  }

  const ready = !!resumeText.trim() && !!jd.trim();
  // GPT 式紧凑:只显示军师最新一句(历史仍在 msgs 里,状态由小票承载)
  const lastAgent = [...msgs].reverse().find((m) => m.role === "agent");

  return (
    <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-[#101f1a] font-sans">
      {/* 背景层:渐变兜底 → 海报帧 → 运镜视频(素材缺席自动降级) */}
      <div
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{ background: "linear-gradient(180deg,#16302b 0%,#1d3a30 45%,#0f211d 100%)", transform: "scale(1.07)" }}
      >
        {posterOk && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/bamboo/poster.png"
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            onError={() => setPosterOk(false)}
          />
        )}
        {videoOk && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/bamboo/intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onError={() => setVideoOk(false)}
          />
        )}
      </div>
      <div ref={leavesRef} aria-hidden className="pointer-events-none absolute inset-0" />
      {/* 暗角,收视线 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 85% at 50% 40%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* 标题:运镜回正时浮现 */}
      <header
        className={`pointer-events-none absolute inset-x-0 top-[14vh] text-center transition-all duration-[1400ms] ease-out ${
          showTitle ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="font-serifcn text-[56px] font-semibold leading-none tracking-[0.06em] text-[#f2efe6] [text-shadow:0_2px_30px_rgba(0,0,0,0.65)]">
          简配
        </div>
        <div className="mt-3 text-[11.5px] tracking-[0.5em] text-[#f2efe6]/55">求职军师 · 看穿 JD · 研判值不值得打</div>
      </header>

      {/* 右上角:回上次研判(有存档才显示) */}
      {lastEntry &&
        (lastEntry.kind === "session" ? (
          <Link
            href="/agent-result"
            className="absolute right-5 top-5 z-20 rounded-full border-[0.5px] border-white/25 bg-black/25 px-3.5 py-1.5 text-[12px] text-[#f2efe6]/80 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            上次研判 →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openHistoryItem(lastEntry.item)}
            className="absolute right-5 top-5 z-20 rounded-full border-[0.5px] border-white/25 bg-black/25 px-3.5 py-1.5 text-[12px] text-[#f2efe6]/80 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            上次研判 →
          </button>
        ))}

      {/* 玻璃对话框:锚在标题下方(不再垂直居中,内容多也不会顶到标题)。
          不做位移视差——Chrome 里 backdrop-blur 元素每帧改 transform 会丢渲染层(之前"有时消失"的病根) */}
      <div className="absolute inset-x-0 bottom-6 top-[max(34vh,240px)] flex items-start justify-center px-4">
        <div
          className={`w-[min(92vw,640px)] overflow-hidden rounded-[20px] border-[0.5px] border-white/15 bg-[#0b1611]/70 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all delay-200 duration-[1400ms] ease-out ${
            showTitle ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-[#f2efe6]/30 to-transparent" />
          {/* 对话流 */}
          <div
            ref={chatRef}
            className="max-h-[36vh] min-h-[96px] overflow-y-auto px-5 pt-5 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {lastAgent && (
              <div className="whitespace-pre-wrap rounded-xl bg-black/35 px-3.5 py-2.5 font-serifcn text-[13.5px] leading-relaxed text-[#f2efe6]">
                {lastAgent.text}
              </div>
            )}
            {intaking && <div className="mt-2 text-[12px] text-[#f2efe6]/55">军师阅卷中…</div>}
          </div>

          {/* 规划邀请卡片：用户说"帮我定方向"后出现 */}
          {careerInviteRef.current && (
            <div className="px-5 pb-3">
              <Link
                href="/career"
                className="flex items-center justify-between rounded-xl border border-[#8fb996]/40 bg-[#8fb996]/10 px-4 py-3 transition-colors hover:bg-[#8fb996]/20"
              >
                <span className="text-[13.5px] text-[#cfe3cf]">去小简那，看看简历能往哪些方向走</span>
                <span className="font-serifcn text-[16px] text-[#8fb996]">→</span>
              </Link>
            </div>
          )}

          {/* 槽位小票(✕ = 撤下换料) */}
          <div className="flex flex-wrap gap-2 px-5 pt-1">
            {resumeText.trim() ? (
              <span className="flex items-center gap-1.5 rounded-full border border-[#8fb996]/50 bg-[#8fb996]/15 px-2.5 py-0.5 text-[11.5px] text-[#cfe3cf]">
                简历 ✓ {resumeName || "已收"}
                <button type="button" aria-label="换简历" title="换简历" onClick={clearResume} className="text-[#cfe3cf]/60 transition-colors hover:text-white">
                  ✕
                </button>
              </span>
            ) : (
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11.5px] text-[#f2efe6]/45">简历 · 待收</span>
            )}
            {jd.trim() ? (
              <span className="flex items-center gap-1.5 rounded-full border border-[#8fb996]/50 bg-[#8fb996]/15 px-2.5 py-0.5 text-[11.5px] text-[#cfe3cf]">
                岗位 ✓ {jd.trim().length} 字
                <button type="button" aria-label="换岗位" title="换岗位" onClick={clearJd} className="text-[#cfe3cf]/60 transition-colors hover:text-white">
                  ✕
                </button>
              </span>
            ) : (
              <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11.5px] text-[#f2efe6]/45">岗位 · 待收</span>
            )}
            {goal.trim() && (
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-0.5 text-[11.5px] text-[#f2efe6]/70">
                意向:{goal.trim().slice(0, 18)}
                <button type="button" aria-label="清除意向" title="清除意向" onClick={clearGoal} className="text-[#f2efe6]/50 transition-colors hover:text-white">
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* 输入行 */}
          <div className="flex items-end gap-2 p-4">
            <button
              type="button"
              aria-label="上传简历或截图"
              title="上传简历 / JD 截图(PDF · Word · 图片)"
              onClick={() => fileRef.current?.click()}
              disabled={intaking || loading}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/20 text-[#f2efe6]/80 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 12.5l-8.6 8.6a5.5 5.5 0 01-7.8-7.8l8.6-8.6a3.7 3.7 0 015.2 5.2l-8.3 8.3a1.85 1.85 0 01-2.6-2.6l7.6-7.6" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <textarea
              rows={2}
              value={draft}
              disabled={intaking || loading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="丢简历、贴 JD、或说一句「想投什么」…(Enter 发送)"
              className="max-h-28 flex-1 resize-none rounded-xl border border-white/15 bg-black/20 px-3.5 py-2 text-[14px] leading-relaxed text-[#f2efe6] placeholder:text-[#f2efe6]/40 outline-none transition-colors focus:border-[#8fb996]/60 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              type="button"
              aria-label="发送"
              onClick={handleSend}
              disabled={intaking || loading || !draft.trim()}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border-[0.5px] border-white/25 bg-white/[0.06] font-serifcn text-[15px] text-[#f2efe6]/90 transition-colors hover:bg-white/15 active:scale-95 disabled:opacity-40"
            >
              递
            </button>
          </div>

          {/* 规划模式桥：有简历无JD → 次级CTA去职业规划 */}
          {resumeText.trim() && !jd.trim() && !loading && (
            <div className="px-4 pb-2">
              <Link
                href="/career"
                className="block w-full rounded-lg border border-white/10 bg-transparent py-2 text-center font-serifcn text-[13px] text-[#f2efe6]/55 transition-colors hover:border-[#8fb996]/40 hover:text-[#8fb996]"
              >
                还没有岗位？先去小简那聊聊你能往哪走 →
              </Link>
            </div>
          )}

          {/* 齐了 → 朱印研判 */}
          {ready && !loading && (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={analyze}
                className="w-full rounded-xl bg-[#a83f39] py-3 font-serifcn text-[16px] tracking-[0.15em] text-[#fdf3ea] shadow-[0_6px_20px_rgba(150,40,30,0.45)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                开始研判
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-[#f2efe6]/45">
        简历与意图只存在你这台浏览器本地,不上传不留存 · 不编造,可追溯
      </p>

      {/* 研判中(全屏,宣纸质感) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#14281f]/70 backdrop-blur-2xl">
          <div className="font-serifcn text-[24px] font-semibold tracking-[0.25em] text-[#f2efe6]">研判中</div>
          <div className="mt-2 text-[12px] tracking-[0.2em] text-[#f2efe6]/50">军师逐层过卷 · 约 30–60 秒</div>
          <div className="mt-9 flex flex-col gap-3">
            {STAGES.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 font-serifcn text-[15px] transition-colors ${
                  i < stage ? "text-[#8fb996]" : i === stage ? "text-[#f2efe6]" : "text-[#f2efe6]/35"
                }`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: i < stage ? "#8fb996" : i === stage ? "#e8e4d8" : "rgba(242,239,230,0.25)" }}
                />
                {s}
                {i === stage && <span className="text-[11px] text-[#8fb996]">进行中…</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
