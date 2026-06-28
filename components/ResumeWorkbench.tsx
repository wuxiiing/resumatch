"use client";

// 简配 2.0 · 简历修改（重做版）。纯文本 → 一键智能整理成结构化 → 逐块编辑 → 专业模板导出。
// 结构化简历存 localStorage(jianpei:resume-structured);原始纯文本来自档案(jianpei:profile)。

import { useEffect, useState } from "react";
import { JIANPEI_PROFILE_KEY, type JianpeiProfile } from "@/lib/agent-report";
import { type ResumeSection, type StructuredResume } from "@/lib/resume-structured";

const STRUCT_KEY = "jianpei:resume-structured";

const inputCls = "w-full rounded-md border border-gf-rule bg-gf-surface px-3 py-2 text-[13.5px] text-gf-ink outline-none transition-colors focus:border-gf-green";

export function ResumeWorkbench() {
  const [resume, setResume] = useState<StructuredResume | null>(null);
  const [rawText, setRawText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STRUCT_KEY);
      if (s) setResume(JSON.parse(s) as StructuredResume);
      const p = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (p) setRawText((JSON.parse(p) as JianpeiProfile).resumeText ?? "");
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
      setResume(data as StructuredResume);
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
      const res = await fetch("/api/export-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume })
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

  function exportPdf() {
    if (resume) printResume(resume);
  }

  // ── 嵌套不可变更新 ──
  const patch = (p: Partial<StructuredResume>) => setResume((r) => (r ? { ...r, ...p } : r));
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
    <div className="mx-auto max-w-[820px] px-5 py-8 sm:px-8">
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
        <div className="rounded-xl border border-gf-rule bg-gf-surface p-5">
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
        <div className="space-y-6">
          <section className="rounded-xl border border-gf-rule bg-gf-surface p-4">
            <div className="mb-3 text-[11px] tracking-[0.12em] text-gf-faint">基本信息</div>
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
            <button type="button" onClick={exportPdf} className="rounded-md border border-gf-rule px-4 py-2.5 font-serifcn text-[14px] text-gf-soft transition-colors hover:bg-gf-greentint">导出 PDF</button>
            <button type="button" onClick={organize} disabled={organizing} className="text-[12.5px] text-gf-faint transition-colors hover:text-gf-soft disabled:opacity-50">{organizing ? "重新整理中…" : "从原文重新整理"}</button>
            {note && <span className="text-[12.5px] text-gf-soft">{note}</span>}
          </div>
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

// 结构化简历 → 专业排版 A4 → 打印(另存为 PDF)。
function printResume(resume: StructuredResume): void {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body =
    `<h1>${esc(resume.name || "姓名")}</h1>` +
    (resume.headline.trim() ? `<p class="hl">${esc(resume.headline)}</p>` : "") +
    (resume.contacts.length ? `<p class="ct">${resume.contacts.filter((c) => c.trim()).map(esc).join("　·　")}</p>` : "") +
    resume.sections
      .map(
        (sec) =>
          `<h2>${esc(sec.title)}</h2>` +
          sec.entries
            .map(
              (e) =>
                (e.heading.trim() || e.meta.trim()
                  ? `<div class="eh"><span class="ehn">${esc(e.heading)}</span><span class="ehm">${esc(e.meta)}</span></div>`
                  : "") +
                e.bullets
                  .filter((b) => b.trim())
                  .map((b) => `<div class="bl">${esc(b)}</div>`)
                  .join("")
            )
            .join("")
      )
      .join("");

  const css =
    "@page{size:A4;margin:15mm 16mm}html,body{margin:0;padding:0}" +
    'body{font-family:"宋体",SimSun,"Songti SC",serif;color:#23271f;font-size:10.5pt;line-height:1.6}' +
    "h1{font-size:19pt;font-weight:700;text-align:center;margin:0 0 3pt}" +
    ".hl{text-align:center;color:#5e5641;font-size:11pt;margin:0 0 3pt}" +
    ".ct{text-align:center;color:#5e5641;font-size:9.5pt;margin:0 0 14pt}" +
    "h2{font-size:12.5pt;font-weight:700;border-bottom:1px solid #52724b;padding-bottom:3pt;margin:15pt 0 7pt}" +
    ".eh{display:flex;justify-content:space-between;align-items:baseline;margin:7pt 0 3pt}" +
    ".ehn{font-weight:700}.ehm{color:#8a7e64;font-size:9.5pt}" +
    ".bl{margin:0 0 4pt;padding-left:1.1em;text-indent:-1.1em}.bl::before{content:'· '}";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(resume.name || "简历")}</title><style>${css}</style></head><body>${body}</body></html>`);
  doc.close();
  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }
  const cleanup = () => setTimeout(() => iframe.remove(), 800);
  win.onafterprint = cleanup;
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  setTimeout(cleanup, 60000);
}
