"use client";

// 简配 2.0 · 输入页（功能层）。竹简形态的真表单：简历 + JD + 意图 → 跑真 agent 分析。
// 「记忆」：简历/意图存浏览器本地档案，换 JD 不用重贴。两侧竹林惊艳层后续用 Spline 叠。
// 不动已部署 MVP（app/page.tsx）。

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGENT_REPORT_KEY,
  JIANPEI_PROFILE_KEY,
  type AgentReport,
  type JianpeiProfile
} from "@/lib/agent-report";

const GF_TEXTURE = {
  backgroundImage:
    "radial-gradient(rgba(74,57,32,0.05) 0.5px, transparent 0.6px), radial-gradient(rgba(74,57,32,0.045) 0.5px, transparent 0.6px), repeating-linear-gradient(7deg, rgba(74,57,32,0.02) 0, rgba(74,57,32,0.02) 1px, transparent 1px, transparent 4px)",
  backgroundSize: "4px 4px, 7px 6px, auto",
  backgroundPosition: "0 0, 2px 3px, 0 0"
};

const STAGES = ["① 看穿 JD 真身", "② 提取简历证据", "③ 立体匹配研判", "④ 生成应对策略"];

export default function AgentInputPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [targetDirection, setTargetDirection] = useState("");
  const [hardNo, setHardNo] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 读本地档案（记忆）：有就预填，换 JD 不用重贴简历
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as JianpeiProfile;
      if (p.resumeText) {
        setResumeText(p.resumeText);
        setResumeName(p.resumeName || "已记住的简历");
        setRemembered(true);
      }
      if (p.intent) {
        setTargetDirection(p.intent.targetDirection || "");
        setHardNo((p.intent.hardNo || []).join("、"));
      }
    } catch {
      /* 档案损坏就当没有 */
    }
  }, []);

  async function handleFile(file: File) {
    setError("");
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.text) throw new Error(data.error || "简历解析失败");
      setResumeText(data.text);
      setResumeName(file.name);
      setRemembered(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "简历解析失败");
    } finally {
      setParsing(false);
    }
  }

  async function analyze() {
    setError("");
    if (!resumeText.trim()) return setError("先上传或粘贴你的简历");
    if (!jd.trim()) return setError("先粘贴目标岗位的 JD");

    const intent = {
      targetDirection: targetDirection.trim(),
      hardNo: hardNo.split(/[、,，;；\s]+/).map((s) => s.trim()).filter(Boolean)
    };
    // 写入本地档案（记忆）：简历 + 意图持久
    try {
      localStorage.setItem(
        JIANPEI_PROFILE_KEY,
        JSON.stringify({ resumeText, resumeName, intent } satisfies JianpeiProfile)
      );
    } catch {
      /* 存不了也不挡分析 */
    }

    setLoading(true);
    setStage(0);
    // 进度提示（估算节奏，非逐节点实时；真实结果以请求返回为准）
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 12000);
    try {
      const res = await fetch("/api/agent-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription: jd, userIntent: intent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "分析失败，请重试");
      const report: AgentReport = {
        meta: {
          position: position.trim(),
          company: company.trim(),
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
      setError(e instanceof Error ? e.message : "分析失败，请重试");
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  }

  const fieldCls =
    "w-full rounded-md border border-gf-rule bg-gf-surface/60 px-3 py-2 text-[14px] text-gf-ink placeholder:text-gf-faint outline-none transition-colors focus:border-gf-green focus:ring-2 focus:ring-gf-green/15";

  return (
    <div className="relative min-h-screen bg-gf-paper font-sans text-gf-ink" style={GF_TEXTURE}>
      <main className="mx-auto flex max-w-[640px] flex-col px-6 py-12">
        <header className="mb-8 text-center">
          <div className="font-serifcn text-[34px] font-semibold tracking-tight text-gf-ink">
            简<span className="text-gf-green">配</span>
          </div>
          <div className="mt-1 text-[13px] tracking-wide text-gf-faint">求职军师 · 看穿 JD，研判这一仗值不值得打</div>
        </header>

        {/* 竹简形态的输入卡：左缘竹片暗示 */}
        <div className="relative overflow-hidden rounded-xl border border-gf-rule bg-gf-surface/80 p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #d8cba8 0, #d8cba8 3px, #cdbf99 3px, #cdbf99 6px)"
            }}
          />

          <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-gf-ink">
            <span>你的简历</span>
            {remembered && <span className="text-[11px] font-normal text-gf-green">已记住 · 换 JD 不用重传</span>}
          </label>
          <div className="mb-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-gf-rule px-3 py-1.5 text-[13px] text-gf-soft transition-colors hover:bg-gf-greentint"
            >
              {parsing ? "解析中…" : "上传文件"}
            </button>
            <span className="truncate text-[12px] text-gf-faint">
              {resumeName ? resumeName : "支持 PDF / Word / Excel / txt，或直接粘贴 ↓"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
          <textarea
            className={`${fieldCls} h-28 resize-y font-serifcn leading-relaxed`}
            placeholder="上传后自动填入，也可直接粘贴简历正文…"
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setRemembered(false);
            }}
          />

          <label className="mb-1.5 mt-5 block text-[13px] font-medium text-gf-ink">目标岗位 JD</label>
          <textarea
            className={`${fieldCls} h-36 resize-y font-serifcn leading-relaxed`}
            placeholder="把岗位描述整段贴进来（BOSS 等不让复制的，识图 OCR 随后支持）…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gf-ink">目标方向</label>
              <input
                className={fieldCls}
                placeholder="如：AI 产品经理"
                value={targetDirection}
                onChange={(e) => setTargetDirection(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gf-ink">绝不接受</label>
              <input
                className={fieldCls}
                placeholder="如：纯执行岗、外包（顿号分隔）"
                value={hardNo}
                onChange={(e) => setHardNo(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gf-ink">
                岗位名 <span className="text-gf-faint">· 选填</span>
              </label>
              <input
                className={fieldCls}
                placeholder="留空我们从 JD 自己认"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gf-ink">
                公司 <span className="text-gf-faint">· 选填</span>
              </label>
              <input
                className={fieldCls}
                placeholder="猎头不说就留空"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="mt-5 text-[13px] text-gf-seal">{error}</div>}

          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="mt-7 w-full rounded-md bg-gf-green py-3 font-serifcn text-[16px] tracking-wide text-white transition-colors hover:bg-gf-greend disabled:opacity-60"
          >
            {loading ? "研判中…" : "开始研判"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-gf-faint">
          简历与意图只存在你这台浏览器本地（记忆），不上传不留存 · 不编造，可追溯
        </p>
      </main>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gf-paper/92" style={GF_TEXTURE}>
          <div className="font-serifcn text-[22px] font-semibold text-gf-green">简配 · 研判中</div>
          <div className="mt-1 text-[12px] text-gf-faint">AI 逐层研判，约 30–60 秒，请稍候</div>
          <div className="mt-7 flex flex-col gap-2.5">
            {STAGES.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 font-serifcn text-[15px] transition-colors ${
                  i < stage ? "text-gf-greend" : i === stage ? "text-gf-ink" : "text-gf-faint"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: i <= stage ? "#52724b" : "#d0cbb8" }}
                />
                {s}
                {i === stage && <span className="text-[12px] text-gf-green">进行中…</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
