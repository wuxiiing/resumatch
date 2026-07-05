"use client";

// 简配 2.0 · 简历修改（重做版）。纯文本 → 一键智能整理成结构化 → 逐块编辑 → 专业模板导出。
// 结构化简历存 localStorage(jianpei:resume-structured);原始纯文本来自档案(jianpei:profile)。

import { useEffect, useState, type ChangeEvent } from "react";
import { JIANPEI_PROFILE_KEY, AGENT_REPORT_KEY, type JianpeiProfile, type AgentReport } from "@/lib/agent-report";
import { type ResumeSection, type StructuredResume } from "@/lib/resume-structured";
import { loadHistory } from "@/lib/history";

const STRUCT_KEY = "jianpei:resume-structured";

const inputCls = "w-full rounded-md border border-gf-rule bg-gf-surface px-3 py-2 text-[13.5px] text-gf-ink outline-none transition-colors focus:border-gf-green";

export function ResumeWorkbench() {
  const [resume, setResume] = useState<StructuredResume | null>(null);
  const [rawText, setRawText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [report, setReport] = useState<AgentReport | null>(null); // 最近一次研判，供「研判版」导出
  const [template, setTemplate] = useState<"ats-classic" | "apple" | "notion">("ats-classic"); // PDF 模板风格
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 右侧实时预览的 PDF blob URL

  useEffect(() => {
    try {
      const s = localStorage.getItem(STRUCT_KEY);
      if (s) setResume(JSON.parse(s) as StructuredResume);
      const p = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (p) setRawText((JSON.parse(p) as JianpeiProfile).resumeText ?? "");
      // 最近一次研判：先看本次会话（sessionStorage），再退回本地历史第一条
      const last = sessionStorage.getItem(AGENT_REPORT_KEY);
      if (last) setReport(JSON.parse(last) as AgentReport);
      else setReport(loadHistory()[0]?.report ?? null);
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!resume) return;
    try {
      localStorage.setItem(STRUCT_KEY, JSON.stringify(resume));
    } catch {
      /* 存不下不影响 */
    }
  }, [resume]);

  // 右侧实时预览：resume / 模板变化后防抖 700ms，向服务端要一份当前模板的 PDF 显示。
  useEffect(() => {
    if (!resume) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/export-resume-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: "pdf", template, resume })
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      } catch {
        /* 预览失败静默，不打扰编辑 */
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [resume, template]);

  async function organize() {
    if (!rawText.trim() || organizing) return;
    setOrganizing(true);
    setNote(null);
    try {
      const res = await fetch("/api/resume-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: rawText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "整理失败");
      setResume((prev) => ({ ...(data as StructuredResume), photo: prev?.photo })); // 重新整理保留已上传的照片
      setNote("整理好了,下面可以逐块改。");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "整理失败,请重试。");
    } finally {
      setOrganizing(false);
    }
  }

  async function exportWord() {
    if (!resume || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/export-resume-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "docx", resume, download: true })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "导出失败");
      }
      const blob = await res.blob();
      downloadBlob(blob, `${resume.name || "简历"}.docx`);
      setNote("已导出 Word。");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "导出失败,请重试。");
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    if (!resume || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/export-resume-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf", template, resume, download: true })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "导出失败");
      }
      const blob = await res.blob();
      downloadBlob(blob, `${resume.name || "简历"}.pdf`);
      setNote("已导出 PDF(排版模板)。");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "导出失败,请重试。");
    } finally {
      setBusy(false);
    }
  }

  // ── 嵌套不可变更新 ──
  async function exportAiPro() {
    if (!resume || !report || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/export-resume-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf", template: "ai-pro", resume, report, download: true })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "导出失败");
      }
      const blob = await res.blob();
      downloadBlob(blob, `${resume.name || "简历"}-研判版.pdf`);
      setNote("已导出研判版 PDF（第 2 页含岗位匹配研判）。");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "导出失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  const patch = (p: Partial<StructuredResume>) => setResume((r) => (r ? { ...r, ...p } : r));
  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许再次选择同一文件
    if (!file || !resume) return;
    try {
      patch({ photo: await fileToScaledDataUrl(file) });
    } catch {
      setNote("照片处理失败，换一张试试。");
    }
  }
  const setSec = (si: number, p: Partial<ResumeSection>) =>
    setResume((r) => {
      if (!r) return r;
      const sections = r.sections.map((s, i) => (i === si ? { ...s, ...p } : s));
      return { ...r, sections };
    });
  const addSec = () => setResume((r) => (r ? { ...r, sections: [...r.sections, { title: "新板块", entries: [{ heading: "", meta: "", bullets: [""] }] }] } : r));
  const delSec = (si: number) => setResume((r) => (r ? { ...r, sections: r.sections.filter((_, i) => i !== si) } : r));
  const setEntry = (si: number, ei: number, p: Partial<{ heading: string; meta: string; bullets: string[] }>) =>
    setSecEntries(si, (entries) => entries.map((e, i) => (i === ei ? { ...e, ...p } : e)));
  const addEntry = (si: number) => setSecEntries(si, (entries) => [...entries, { heading: "", meta: "", bullets: [""] }]);
  const delEntry = (si: number, ei: number) => setSecEntries(si, (entries) => entries.filter((_, i) => i !== ei));
  function setSecEntries(si: number, fn: (e: ResumeSection["entries"]) => ResumeSection["entries"]) {
    setResume((r) => {
      if (!r) return r;
      const sections = r.sections.map((s, i) => (i === si ? { ...s, entries: fn(s.entries) } : s));
      return { ...r, sections };
    });
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8">
      <header className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-medium tracking-wide text-gf-green">
          <span className="inline-block h-3 w-[5px] rounded-[2px] bg-gf-green" /> 简历修改
        </div>
        <h1 className="font-serifcn text-[26px] font-semibold text-gf-ink">把简历理顺,导出能用</h1>
        <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-gf-faint">
          先一键把你的简历整理成有层次的结构(姓名 / 定位 / 各板块条目),再逐块改;导出的 Word / PDF 是排好版的专业简历,不是一坨文本。
        </p>
      </header>

      {!resume ? (
        <div className="mx-auto max-w-[820px] rounded-xl border border-gf-rule bg-gf-surface p-5">
          {rawText.trim() ? (
            <>
              <p className="mb-3 text-[13px] leading-relaxed text-gf-soft">读到你的简历原文了。点下面,我把它整理成结构化简历(只重组、不改你的事实)。</p>
              <button
                type="button"
                onClick={organize}
                disabled={organizing}
                className="rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend disabled:opacity-50"
              >
                {organizing ? "整理中…" : "智能整理简历"}
              </button>
              {note && <span className="ml-3 text-[12.5px] text-gf-soft">{note}</span>}
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-gf-soft">还没有简历原文。先去「我的简历」里贴上简历正文,再回来整理。</p>
          )}
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
          <div className="space-y-6">
          <section className="rounded-xl border border-gf-rule bg-gf-surface p-4">
            <div className="mb-3 text-[11px] tracking-[0.12em] text-gf-faint">基本信息</div>
            <div className="mb-3 flex items-center gap-3">
              {resume.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resume.photo} alt="证件照" className="h-[84px] w-[60px] rounded border border-gf-rule object-cover" />
              ) : (
                <div className="flex h-[84px] w-[60px] items-center justify-center rounded border border-dashed border-gf-rule text-[11px] text-gf-faint">照片</div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="inline-block cursor-pointer rounded-md border border-gf-rule px-3 py-1.5 text-[12.5px] text-gf-soft transition-colors hover:border-gf-green hover:text-gf-green">
                    {resume.photo ? "更换照片" : "上传照片"}
                    <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                  </label>
                  {resume.photo && (
                    <button type="button" onClick={() => patch({ photo: undefined })} className="text-[12px] text-gf-faint transition-colors hover:text-gf-seal">移除</button>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-gf-faint">证件照，竖版 1-2 寸；仅国内简历用，导出 PDF 时显示在右上角。</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <input className={inputCls} value={resume.name} onChange={(e) => patch({ name: e.target.value })} placeholder="姓名" />
              <input className={inputCls} value={resume.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="一句话定位,如:AI 产品经理 · 半年独立项目转型" />
              <textarea
                className={`${inputCls} min-h-[64px] resize-y leading-relaxed`}
                value={resume.contacts.join("\n")}
                onChange={(e) => patch({ contacts: e.target.value.split("\n") })}
                placeholder={"联系方式,每行一条\n城市 · 电话 · 邮箱 · GitHub"}
              />
            </div>
          </section>

          {resume.sections.map((sec, si) => (
            <section key={si} className="rounded-xl border border-gf-rule bg-gf-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <input className={`${inputCls} font-serifcn text-[15px] font-semibold`} value={sec.title} onChange={(e) => setSec(si, { title: e.target.value })} placeholder="板块名,如 项目经历" />
                <button type="button" onClick={() => delSec(si)} className="shrink-0 rounded-md border border-gf-rule px-2.5 py-2 text-[12px] text-gf-faint transition-colors hover:border-gf-seal hover:text-gf-seal">删板块</button>
              </div>
              <div className="space-y-4">
                {sec.entries.map((e, ei) => (
                  <div key={ei} className="rounded-lg border border-gf-rule bg-gf-paper p-3">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <input className={`${inputCls} flex-1`} value={e.heading} onChange={(ev) => setEntry(si, ei, { heading: ev.target.value })} placeholder="标题,如 公司 / 学校 / 项目名(纯叙述可留空)" />
                      <input className={`${inputCls} sm:w-[200px]`} value={e.meta} onChange={(ev) => setEntry(si, ei, { meta: ev.target.value })} placeholder="时间 / 角色" />
                    </div>
                    <textarea
                      className={`${inputCls} min-h-[72px] resize-y leading-relaxed`}
                      value={e.bullets.join("\n")}
                      onChange={(ev) => setEntry(si, ei, { bullets: ev.target.value.split("\n") })}
                      placeholder={"要点,每行一条(动词开头、能量化就量化)"}
                    />
                    <div className="mt-1.5 text-right">
                      <button type="button" onClick={() => delEntry(si, ei)} className="text-[11.5px] text-gf-faint transition-colors hover:text-gf-seal">删除这条</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addEntry(si)} className="rounded-md border border-dashed border-gf-rule px-3 py-1.5 text-[12.5px] text-gf-soft transition-colors hover:border-gf-green hover:text-gf-green">＋ 加一条</button>
              </div>
            </section>
          ))}

          <button type="button" onClick={addSec} className="w-full rounded-xl border border-dashed border-gf-rule py-2.5 text-[13px] text-gf-soft transition-colors hover:border-gf-green hover:text-gf-green">＋ 加一个板块</button>

          <div className="flex flex-wrap items-center gap-3 border-t border-gf-rule pt-4">
            <button type="button" onClick={exportWord} disabled={busy} className="rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend disabled:opacity-50">
              {busy ? "导出中…" : "导出 Word"}
            </button>
            <select value={template} onChange={(e) => setTemplate(e.target.value as typeof template)} className="rounded-md border border-gf-rule bg-gf-surface px-2.5 py-2.5 text-[13px] text-gf-ink outline-none transition-colors focus:border-gf-green">
              <option value="ats-classic">经典</option>
              <option value="apple">苹果风</option>
              <option value="notion">Notion 风</option>
            </select>
            <button type="button" onClick={exportPdf} disabled={busy} className="rounded-md border border-gf-rule px-4 py-2.5 font-serifcn text-[14px] text-gf-soft transition-colors hover:bg-gf-greentint disabled:opacity-50">导出 PDF</button>
            {report && (
              <button type="button" onClick={exportAiPro} disabled={busy} className="rounded-md border border-gf-green px-4 py-2.5 font-serifcn text-[14px] text-gf-green transition-colors hover:bg-gf-greentint disabled:opacity-50">导出研判版 PDF</button>
            )}
            <button type="button" onClick={organize} disabled={organizing} className="text-[12.5px] text-gf-faint transition-colors hover:text-gf-soft disabled:opacity-50">{organizing ? "重新整理中…" : "从原文重新整理"}</button>
            {note && <span className="text-[12.5px] text-gf-soft">{note}</span>}
          </div>
          </div>
          <aside className="mt-6 hidden lg:mt-0 lg:block lg:sticky lg:top-8">
            <div className="mb-2 text-[11px] tracking-[0.12em] text-gf-faint">实时预览（当前模板）</div>
            {previewUrl ? (
              <iframe title="简历预览" src={previewUrl} className="h-[600px] w-full rounded-lg border border-gf-rule bg-white" />
            ) : (
              <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-dashed border-gf-rule text-[12.5px] text-gf-faint">预览生成中…</div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 把上传的图片压到证件照尺寸（限宽 420px，转 jpeg）。避免大图撑爆 localStorage、也让 PDF 不臃肿。
async function fileToScaledDataUrl(file: File, maxW = 420): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("读图失败"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("解码失败"));
    i.src = raw;
  });
  const scale = Math.min(1, maxW / img.width);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}
