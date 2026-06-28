"use client";

// 简配 2.0 · 职业规划「小简」· 聊天式。小简是职业规划老师,扎根简历+意愿,多轮对话做规划。
// 对话历史存 localStorage(同浏览器);后端 /api/career-chat。不画时间饼、对不上就老实点破。

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AppNav } from "@/components/AppNav";
import { JIANPEI_PROFILE_KEY, type JianpeiProfile } from "@/lib/agent-report";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_KEY = "jianpei:career-chat";
const OPENING =
  "你好,我是小简,你的职业规划老师。我看了你的简历和你想去的方向——想聊往哪走、还差什么、哪条路更稳,都可以问我。我扎着你的简历说实话,不画饼。";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JIANPEI_PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as JianpeiProfile);
      const chat = localStorage.getItem(CHAT_KEY);
      if (chat) setMessages(JSON.parse(chat) as Msg[]);
    } catch {
      /* 坏数据当没有 */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* 存不下不影响 */
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(quick?: string) {
    const text = (quick ?? input).trim();
    if (!text || loading || !profile?.resumeText) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profile.resumeText,
          targetDirection: profile.intent?.targetDirection ?? "",
          hardNo: profile.intent?.hardNo ?? [],
          messages: next
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "对话失败");
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "对话失败,请重试");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return null;

  const hasResume = Boolean(profile?.resumeText);

  return (
    <AppShell brand={<span className="truncate text-[13.5px] text-gf-soft">职业规划 · 小简</span>} nav={<AppNav current="career" />}>
      <div className="gf-rise mx-auto flex h-full max-w-[720px] flex-col px-4 py-4 sm:px-6">
        <header className="mb-3 shrink-0 border-b border-gf-rule pb-3">
          <h1 className="font-serifcn text-[20px] font-semibold text-gf-ink">
            小简 <span className="text-[13px] font-normal text-gf-faint">· 职业规划老师</span>
          </h1>
          <p className="mt-0.5 text-[12px] text-gf-faint">扎根你的简历和意愿,陪你把方向聊清楚——不画 30/90/180 的时间饼。</p>
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
