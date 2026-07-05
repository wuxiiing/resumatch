"use client";

// 军师对话 · 出谋划策(去人设,正常给建议)。
// 两种形态:embedded=true 填进 AppShell 右栏;默认=右下浮动(向后兼容)。
// 跨窗口:对话历史存 localStorage,绑这次研判,重开报告还在(同浏览器)。

import { useEffect, useRef, useState } from "react";
import { JIANPEI_PROFILE_KEY, type AgentReport, type JianpeiProfile } from "@/lib/agent-report";

type Msg = { role: "user" | "assistant"; content: string };

export function JunshiChat({ report, embedded = false }: { report: AgentReport; embedded?: boolean }) {
  const chatKey = `jianpei:chat:${report.meta.position}|${report.meta.company}|${report.meta.date}`;
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(chatKey);
      setMessages(raw ? (JSON.parse(raw) as Msg[]) : []);
    } catch {
      setMessages([]);
    }
  }, [chatKey]);

  // 持久化:跳过空数组——否则初次挂载(+ StrictMode 双挂载)会用空的覆盖掉已存对话。
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(chatKey, JSON.stringify(messages));
    } catch {
      /* 存不下不影响 */
    }
  }, [messages, chatKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(quick?: string) {
    const text = (quick ?? input).trim();
    if (!text || loading) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    let resumeText = "";
    try {
      const p = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (p) resumeText = (JSON.parse(p) as JianpeiProfile).resumeText || "";
    } catch {
      /* 没档案就空着 */
    }

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, resumeText, messages: next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "对话失败");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "对话失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function recon() {
    if (loading || !report.meta.company) return;
    setError("");
    setMessages((m) => [...m, { role: "user", content: `背调一下「${report.meta.company}」` }]);
    setLoading(true);
    try {
      const res = await fetch("/api/company-recon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: report.meta.company, position: report.meta.position })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "背调失败");
      setMessages((m) => [...m, { role: "assistant", content: data.recon as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "背调失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  // 岗位真实性调查:联网搜招聘帖,看发布时长/重复度（信号非铁证）。结果同样进对话。
  async function investigateJob() {
    if (loading || !report.meta.company) return;
    setError("");
    setMessages((m) => [...m, { role: "user", content: `调查一下「${report.meta.position || "这个岗位"}」这岗真不真` }]);
    setLoading(true);
    try {
      const res = await fetch("/api/job-recon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: report.meta.company, position: report.meta.position })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "岗位调查失败");
      setMessages((m) => [...m, { role: "assistant", content: data.recon as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "岗位调查失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  // 浮动模式未展开 → 只露一个圆按钮
  if (!embedded && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gf-green px-5 py-2.5 font-serifcn text-[15px] text-white"
        style={{ boxShadow: "0 8px 22px rgba(35,39,31,0.18)" }}
      >
        问军师
      </button>
    );
  }

  const panel = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-gf-rule px-4 py-2.5">
        <span className="font-serifcn text-[15px] font-medium text-gf-ink">
          军师对话 <span className="text-[11px] font-normal text-gf-faint">· 扎根本次研判</span>
        </span>
        {!embedded && (
          <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-gf-faint transition-colors hover:text-gf-ink">
            收起
          </button>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="mt-1 space-y-2.5">
            <div className="rounded-xl rounded-tl-sm border border-gf-rule bg-gf-paper px-3.5 py-2.5 font-serifcn text-[13px] leading-relaxed text-gf-soft">
              看完研判,有什么想不透的尽管问——投不投、怎么面、简历哪条弱,我都在。
            </div>
            <div className="space-y-1.5">
              {["这岗我到底要不要投?", "薪资大概能谈到什么水平?", "帮我把简历里最弱那条改强点。"].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="block w-full rounded-lg border border-gf-rule bg-gf-surface px-3 py-2 text-left text-[12.5px] text-gf-soft transition-colors hover:border-gf-green hover:bg-gf-greentint/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-lg bg-gf-green px-3 py-2 text-[13.5px] leading-relaxed text-white"
                  : "max-w-[88%] whitespace-pre-wrap rounded-lg border border-gf-rule bg-gf-surface px-3 py-2 font-serifcn text-[13.5px] leading-relaxed text-gf-ink"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-[12.5px] text-gf-faint">军师思考中…</div>}
        {error && <div className="text-[12.5px] text-gf-seal">{error}</div>}
      </div>

      <div className="shrink-0 border-t border-gf-rule p-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {report.meta.company && (
            <button
              type="button"
              onClick={recon}
              disabled={loading}
              title="联网搜公司口碑 / 加班 / 员工评价"
              className="rounded-md border border-gf-rule px-2.5 py-1 text-[12px] text-gf-green transition-colors hover:bg-gf-greentint disabled:opacity-50"
            >
              背调公司
            </button>
          )}
          {report.meta.company && (
            <button
              type="button"
              onClick={investigateJob}
              disabled={loading}
              title="联网查这岗位的发布时长 / 重复度,判断真实性（信号非铁证）"
              className="rounded-md border border-gf-rule px-2.5 py-1 text-[12px] text-gf-green transition-colors hover:bg-gf-greentint disabled:opacity-50"
            >
              调查岗位
            </button>
          )}
          <button
            type="button"
            onClick={() => send("这个岗位面试大概会考什么?我该怎么准备?")}
            disabled={loading}
            title="针对这个岗位的面试准备"
            className="rounded-md border border-gf-rule px-2.5 py-1 text-[12px] text-gf-green transition-colors hover:bg-gf-greentint disabled:opacity-50"
          >
            面试方法
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            className="h-10 max-h-28 flex-1 resize-none rounded-md border border-gf-rule bg-gf-surface/60 px-3 py-2 text-[13.5px] text-gf-ink outline-none focus:border-gf-green"
            placeholder="问军师…（Enter 发送）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="rounded-md bg-gf-green px-3 py-2 text-[13px] text-white disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex h-full w-full flex-col bg-gf-paper">{panel}</div>;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex w-[370px] max-w-[92vw] flex-col rounded-xl border border-gf-rule bg-gf-paper"
      style={{ height: "70vh", maxHeight: 560, boxShadow: "0 12px 34px rgba(35,39,31,0.22)" }}
    >
      {panel}
    </div>
  );
}
