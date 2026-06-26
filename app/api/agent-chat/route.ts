// 军师对话 · 后端引擎。扎根于「研判报告 + 简历」的多轮对话——不是客服 bot。
// 原理:系统人设 + 注入上下文(报告+简历) + 对话历史 → DeepSeek chat。
// 模型无状态,"记忆"靠每轮重发历史 + 固定上下文。不动旧 MVP。

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMsg = { role: "user" | "assistant"; content: string };
type Body = { report?: unknown; resumeText?: string; messages?: ChatMsg[] };

const SYSTEM = `你是「简配」的求职军师——一个有十年经验的 HR + 求职战略顾问,不是客服机器人。
你面对【这一位求职者】和他的【一份岗位研判报告】(已含:岗位定位 目标/跳板/该绕开、JD 真身、逐条匹配、避雷、应对策略)。

规则:
1. 一切扎根于下方【研判报告】和【简历】,绝不编造事实、不脱离他的真实情况;不确定就说不确定。
2. 有观点、敢直说(像军师,不像客服):该投/该绕、面试怎么准备、简历哪条怎么改,给具体、可执行的建议。
3. 费曼尺:讲人话,必要的术语解释一句就行,别堆黑话。
4. 简洁,像顾问对话,别长篇大论;一次聚焦一两点。
5. 纯文本对话,不要用任何 Markdown 标记——不要用 ** 加粗、# 标题、--- 分割线、- 或 1. 列表。要分点就用 ① ② ③ 或「」,像微信里跟人自然聊天那样,别像写文档。`;

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

  const history = Array.isArray(body.messages) ? body.messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
  if (history.length === 0) {
    return NextResponse.json({ error: "缺少对话消息。" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "服务未配置 DEEPSEEK_API_KEY。" }, { status: 500 });
  }
  const baseUrl = process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const context =
    `【研判报告】\n${clip(JSON.stringify(body.report ?? {}), 6000)}\n\n` +
    `【简历原文】\n${clip((body.resumeText ?? "").trim() || "（求职者未提供简历正文）", 4000)}`;

  const payload = {
    model,
    temperature: 0.5,
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
