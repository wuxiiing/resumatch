"use client";

// 简配 2.0 · 简历工作台：在简历副本上采纳军师建议、改写、导出 Word/PDF。
// 简历原文来自本地档案（localStorage jianpei:profile.resumeText）；这里只改「工作副本」，不动原档案。

import { useEffect, useState } from "react";
import {
  JIANPEI_PROFILE_KEY,
  type ActionPlan,
  type JianpeiProfile
} from "@/lib/agent-report";

export function ResumeWorkbench({ strategy }: { strategy: ActionPlan["resumeStrategy"] }) {
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("简历");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as JianpeiProfile;
        setResumeText(p.resumeText ?? "");
        if (p.resumeName) setResumeName(stripExt(p.resumeName));
      }
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  function adopt(label: string, text: string) {
    if (!text) return;
    setResumeText((prev) => `${prev.trimEnd()}\n\n【${label}建议】${text}`);
    setNote(`已把「${label}」建议追加到副本末尾，按需整合进正文再导出。`);
  }

  async function exportWord() {
    if (!resumeText.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/export-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, name: resumeName })
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      downloadBlob(blob, `${resumeName}.docx`);
      setNote("已导出 Word。");
    } catch {
      setNote("Word 导出失败，请重试。");
    } finally {
      setBusy(false);
    }
  }

  function exportPdf() {
    if (!resumeText.trim()) return;
    printResume(resumeName, resumeText);
  }

  if (!loaded) return null;

  const hasSuggestion = Boolean(strategy?.highlight || strategy?.downplay);

  return (
    <section className="mt-9">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="h-4 w-1 rounded bg-gf-green" />
        <h2 className="whitespace-nowrap font-serifcn text-[18px] font-semibold text-gf-ink">简历工作台</h2>
        <span className="h-px flex-1 bg-gf-rule" />
      </div>
      <p className="mb-3 text-[12.5px] leading-relaxed text-gf-faint">
        这是你简历的<strong className="text-gf-soft">工作副本</strong>（原档案不动）。按军师建议调整后，直接导出 Word 或 PDF。
      </p>

      {!resumeText.trim() && (
        <p className="mb-3 rounded-lg border border-gf-rule bg-gf-surface px-3.5 py-2.5 text-[12.5px] text-gf-soft">
          还没读到简历原文。先回「换一个岗位」里上传简历，副本会自动带过来。
        </p>
      )}

      {hasSuggestion && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {strategy?.highlight && (
            <SuggestionCard label="扬长" text={strategy.highlight} onAdopt={() => adopt("扬长", strategy.highlight)} />
          )}
          {strategy?.downplay && (
            <SuggestionCard label="避短" text={strategy.downplay} onAdopt={() => adopt("避短", strategy.downplay)} />
          )}
        </div>
      )}

      <textarea
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        spellCheck={false}
        placeholder="简历工作副本……"
        className="min-h-[360px] w-full resize-y rounded-xl border border-gf-rule bg-gf-surface p-4 font-sans text-[13.5px] leading-relaxed text-gf-ink outline-none transition-colors focus:border-gf-green"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exportWord}
          disabled={busy || !resumeText.trim()}
          className="rounded-md bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white transition-colors hover:bg-gf-greend disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "导出中…" : "导出 Word"}
        </button>
        <button
          type="button"
          onClick={exportPdf}
          disabled={!resumeText.trim()}
          className="rounded-md border border-gf-rule px-4 py-2.5 font-serifcn text-[14px] text-gf-soft transition-colors hover:bg-gf-greentint disabled:cursor-not-allowed disabled:opacity-50"
        >
          导出 PDF
        </button>
        {note && <span className="text-[12px] text-gf-soft">{note}</span>}
      </div>
    </section>
  );
}

function SuggestionCard({
  label,
  text,
  onAdopt
}: {
  label: string;
  text: string;
  onAdopt: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-gf-rule bg-gf-surface p-3.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-serifcn text-[13px] font-medium text-gf-green">{label}</span>
        <button
          type="button"
          onClick={onAdopt}
          className="rounded border border-gf-rule px-2 py-0.5 text-[11.5px] text-gf-soft transition-colors hover:bg-gf-greentint"
        >
          纳入副本
        </button>
      </div>
      <p className="text-[13px] leading-relaxed text-gf-soft">{text}</p>
    </div>
  );
}

function stripExt(name: string): string {
  return name.replace(/\.(pdf|docx?|txt|xlsx?)$/i, "");
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

// 用隐藏 iframe 写一页 A4 简历再调起打印 → 用户「另存为 PDF」。零依赖、不污染主页面样式。
function printResume(name: string, text: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title>` +
      `<style>@page{size:A4;margin:18mm 16mm;}` +
      `html,body{margin:0;padding:0;}` +
      `body{font-family:"宋体",SimSun,"Songti SC",serif;font-size:11pt;line-height:1.65;color:#1a1a1a;}` +
      `pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}</style>` +
      `</head><body><pre>${esc(text)}</pre></body></html>`
  );
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
  setTimeout(cleanup, 60000); // 兜底：用户取消打印也回收 iframe
}
