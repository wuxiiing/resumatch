"use client";

// 简配 2.0 · 职业规划「小简」· 聊天式。小简是职业规划老师,扎根简历+意愿,多轮对话做规划。
// 对话历史存 localStorage(同浏览器);后端 /api/career-chat。不画时间饼、对不上就老实点破。

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";
import { JIANPEI_PROFILE_KEY, type JianpeiProfile } from "@/lib/agent-report";
import type { CareerPath } from "@/lib/agents/career-path/schema";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_KEY = "jianpei:career-chat";
const PENDING_KEY = "jianpei:career-pending"; // 换窗口/HMR 恢复信号（sessionStorage 跨 fast-refresh 存活）
const OPENING =
  "你好,我是小简,你的职业规划老师。我看了你的简历和你想去的方向——想聊往哪走、还差什么、哪条路更稳,都可以问我。我只照着你的简历和现实讲,不哄你。";

function Avatar() {
  return <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gf-green font-serifcn text-[14px] text-white">简</div>;
}

export default function CareerPage() {
  const [profile, setProfile] = useState<JianpeiProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pathLoading, setPathLoading] = useState(false);
  const [pathResult, setPathResult] = useState<CareerPath | null>(null);
  const [pathError, setPathError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const recoveringRef = useRef(false); // 区分"换窗口恢复"与"正常发送"触发 loading

  // 卸载时：标记已卸载 + 取消飞行中的请求（避免旧组件实例写 state 和 HMR 竞态）
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // 挂载恢复：从 localStorage 加载消息 + 检测孤儿消息（最后一条是 user）自动重试
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as JianpeiProfile);
      const chat = localStorage.getItem(CHAT_KEY);
      if (chat) {
        const msgs = JSON.parse(chat) as Msg[];
        setMessages(msgs);
        // 检测孤儿消息：最后一条是 user → 请求飞行中被 HMR/换窗口打断
        if (msgs.length > 0 && msgs[msgs.length - 1].role === "user") {
          recoveringRef.current = true;
          setLoading(true);
        }
      }
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  // 孤儿消息恢复：loading 被挂载逻辑设为 true 且 recoveringRef 标志位真 → 重试最后一条 user 消息
  useEffect(() => {
    if (!loading || !profile?.resumeText) return;
    if (!recoveringRef.current) return; // 正常发送触发的 loading，不抢
    recoveringRef.current = false;

    const msgs = messages;
    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") {
      setLoading(false);
      return;
    }
    sessionStorage.removeItem(PENDING_KEY);
    retryLastMessage(msgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile]);

  async function retryLastMessage(priorMsgs: Msg[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]),
        body: JSON.stringify({
          resumeText: profile!.resumeText,
          targetDirection: profile!.intent?.targetDirection ?? "",
          hardNo: profile!.intent?.hardNo ?? [],
          messages: priorMsgs
        }),
      });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error(data.error || "对话失败");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "对话失败,请重试");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const send = useCallback(async (quick?: string) => {
    const text = (quick ?? input).trim();
    if (!text || loading || !profile?.resumeText) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    // 写入 localStorage + sessionStorage 标记（供 HMR 恢复）
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(next));
      sessionStorage.setItem(PENDING_KEY, "1");
    } catch { /* ignore */ }
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profile.resumeText,
          targetDirection: profile.intent?.targetDirection ?? "",
          hardNo: profile.intent?.hardNo ?? [],
          messages: next
        }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)])
      });
      const data = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error(data.error || "对话失败");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
      sessionStorage.removeItem(PENDING_KEY);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "对话失败,请重试");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        sessionStorage.removeItem(PENDING_KEY);
      }
    }
  }, [input, loading, messages, profile]);

  // 路径推演：调用 /api/career-path → 展示结果卡片
  async function runPathSimulation() {
    if (pathLoading || !profile?.resumeText) return;
    setPathError("");
    setPathResult(null);
    setPathLoading(true);
    try {
      const res = await fetch("/api/career-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(120_000),
        body: JSON.stringify({
          resumeText: profile.resumeText,
          targetDirection: profile.intent?.targetDirection?.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "推演失败");
      setPathResult(data as CareerPath);
    } catch (e) {
      setPathError(e instanceof Error ? e.message : "路径推演失败，请重试");
    } finally {
      setPathLoading(false);
    }
  }

  if (!loaded) return null;

  const hasResume = Boolean(profile?.resumeText);

  return (
    <AppShell tone="bg-[#f4efe3]" brand={<span className="truncate text-[13.5px] text-gf-soft">职业规划 · 小简</span>} nav={<AppNav current="career" />}>
      <div className="gf-rise mx-auto flex h-full max-w-[720px] flex-col px-4 py-4 sm:px-6">
        <header className="mb-3 shrink-0 border-b border-gf-rule pb-3">
          <h1 className="font-serifcn text-[20px] font-semibold text-gf-ink">
            小简 <span className="text-[13px] font-normal text-gf-faint">· 职业规划老师</span>
          </h1>
          <p className="mt-0.5 text-[12px] text-gf-faint">扎根你的简历和求职意愿,陪你把方向聊清楚——能往哪走、还差什么、哪条路更稳。</p>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-1">
          <div className="flex gap-2.5">
            <Avatar />
            <div className="min-w-0 max-w-[88%] rounded-xl rounded-tl-sm border border-gf-rule bg-gf-surface px-4 py-3 font-serifcn text-[13.5px] leading-relaxed text-gf-ink">{OPENING}</div>
          </div>

          {!hasResume && (
            <div className="ml-[42px]">
              <p className="mb-2 text-[12.5px] text-gf-soft">你还没有档案——先去研判一个岗位、上传简历,我才有东西可看。</p>
              <Link href="/agent" className="inline-block rounded-md bg-gf-green px-4 py-2 font-serifcn text-[14px] text-white transition-colors hover:bg-gf-greend">
                去研判一个岗位 →
              </Link>
            </div>
          )}

          {hasResume && messages.length === 0 && (
            <div className="ml-[42px] space-y-1.5">
              <button
                type="button"
                onClick={runPathSimulation}
                disabled={pathLoading}
                className="block w-full rounded-lg border border-gf-green/50 bg-gf-greentint/30 px-3 py-2.5 text-left font-serifcn text-[13px] text-gf-greend transition-colors hover:bg-gf-greentint/60"
              >
                {pathLoading ? "小简在推演你的职业路径…" : "🗺 推演一下我的职业路径 →"}
              </button>
              {["我这简历能往哪些方向走?", "我想去某个方向,现实吗?", "要够格还差点啥?"].map((q) => (
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
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2.5"}>
              {m.role === "assistant" && <Avatar />}
              <div
                className={
                  m.role === "user"
                    ? "max-w-[82%] rounded-xl rounded-tr-sm bg-gf-green px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"
                    : "min-w-0 max-w-[88%] whitespace-pre-wrap rounded-xl rounded-tl-sm border border-gf-rule bg-gf-surface px-4 py-3 font-serifcn text-[13.5px] leading-relaxed text-gf-ink"
                }
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <Avatar />
              <div className="rounded-xl rounded-tl-sm border border-gf-rule bg-gf-surface px-4 py-3 text-[13px] text-gf-faint">小简在想…</div>
            </div>
          )}
          {error && <div className="ml-[42px] text-[12.5px] text-gf-seal">{error}</div>}

          {/* 路径推演结果卡片 */}
          {pathResult && (
            <div className="ml-[42px] rounded-xl border border-gf-green/30 bg-gf-greentint/10 p-4">
              <p className="mb-0.5 text-[11px] tracking-[0.15em] text-gf-green">职业路径推演</p>
              <p className="mb-3 text-[14px] leading-relaxed text-gf-ink">{pathResult.snapshot}</p>
              {pathResult.paths.map((p, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="mb-1.5 flex items-baseline gap-2">
                    <span className="font-serifcn text-[14px] font-medium text-gf-ink">{p.label}</span>
                    <span className="text-[11.5px] text-gf-faint">{p.rationale}</span>
                  </div>
                  <div className="space-y-1.5">
                    {p.steps.map((s, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gf-green" />
                        <div className="min-w-0 text-[13px] leading-relaxed">
                          <span className="font-medium text-gf-ink">{s.position}</span>
                          <span className={`ml-1.5 text-[11px] ${s.feasibility === "高" ? "text-gf-green" : s.feasibility === "中" ? "text-gf-soft" : "text-gf-seal"}`}>
                            {s.feasibility === "高" ? "✓ 可及" : s.feasibility === "中" ? "○ 可冲" : "△ 需补课"}
                          </span>
                          <span className="ml-1.5 text-gf-faint">{s.basis}</span>
                          {s.gapIfAny && <span className="ml-1 text-gf-seal">— {s.gapIfAny}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {i < pathResult.paths.length - 1 && <div className="mt-2 border-t border-gf-rule" />}
                </div>
              ))}
              <p className="mt-3 text-[11px] leading-relaxed text-gf-faint">{pathResult.caveat}</p>
            </div>
          )}
          {pathError && <div className="ml-[42px] text-[12.5px] text-gf-seal">{pathError}</div>}
        </div>

        <div className="mt-3 shrink-0 border-t border-gf-rule pt-3">
          <div className="flex items-end gap-2">
            <textarea
              className="h-11 max-h-32 flex-1 resize-none rounded-md border border-gf-rule bg-gf-surface/60 px-3 py-2.5 text-[13.5px] text-gf-ink outline-none transition-colors focus:border-gf-green disabled:opacity-60"
              placeholder={hasResume ? "问小简…(Enter 发送)" : "先上传简历,小简才能陪你聊"}
              value={input}
              disabled={!hasResume || loading}
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
              disabled={!hasResume || loading || !input.trim()}
              className="h-11 shrink-0 rounded-md bg-gf-green px-4 font-serifcn text-[14px] text-white transition-colors hover:bg-gf-greend disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
