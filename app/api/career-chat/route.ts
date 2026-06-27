// 小简 · 职业规划老师 · 多轮对话后端。扎根「简历 + 求职意愿」,陪求职者把方向聊清楚。
// 原理同军师对话:系统人设 + 注入上下文(简历+意愿) + 对话历史 → DeepSeek chat。不动旧 MVP。

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMsg = { role: "user" | "assistant"; content: string };
type Body = { resumeText?: string; targetDirection?: string; hardNo?: string[]; messages?: ChatMsg[] };

const SYSTEM = `你是「简配」的职业规划老师小简——基于求职者真实的简历和意愿,陪他把职业方向聊清楚。不是算命、不是性格测试、不是客服。

你面对【这一位求职者】:他的【简历】和【求职意愿】(想去的方向、绝不接受的)。

你的方法:
1. 一切扎根他的真实简历和意愿,不编造、不脱离他的实际;不确定就说不确定。
2. 核心是「现实校准」:他想去的方向 vs 他的简历客观能托起的方向——对得上,就肯定并给精进的方向;对不上,就老实点破短期难在哪、差什么,防止不切实际的幻想。只陈述事实,不打击、不说教。
3. 不画时间饼:不要给「30 天 / 3 个月 / 半年」这种具体周期排程,AI 做时间规划不可靠;只做方向性、定性的判断与建议。
4. 像老师跟学生聊天:有观点、敢直说,但耐心、具体;一次聚焦一两点,别长篇大论。
5. 纯文本对话,不要任何 Markdown 标记(不要 **、#、---、- 或 1. 列表)。要分点就用 ① ② ③ 或「」,像微信里自然聊天那样。`;

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…(略)" : s;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const history = Array.isArray(body.messages)
    ? body.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    : [];
  if (history.length === 0) {
    return NextResponse.json({ error: "缺少对话消息。" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务未配置 DEEPSEEK_API_KEY。" }, { status: 500 });
  }
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const hardNo = Array.isArray(body.hardNo) ? body.hardNo.filter((x) => typeof x === "string").join("、") : "";
  const context =
    `【简历原文】\n${clip((body.resumeText ?? "").trim() || "（求职者未提供简历正文）", 4000)}\n\n` +
    `【求职意愿】\n目标方向：${(body.targetDirection ?? "").trim() || "（未填，可在对话里引导他说清）"}\n绝不接受：${hardNo || "（未填）"}`;

  const payload = {
    model,
    temperature: 0.6,
    messages: [{ role: "system", content: `${SYSTEM}\n\n${context}` }, ...history.map((m) => ({ role: m.role, content: m.content }))]
  };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return NextResponse.json({ error: `AI 服务出错（${res.status}），请重试。` }, { status: 502 });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || reply.trim() === "") {
      return NextResponse.json({ error: "AI 返回为空，请重试。" }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "对话失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
