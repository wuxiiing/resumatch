// 文字入场分诊:一段文字 → jd / goal / resume / other(+ 提炼的求职意向)。
// 轻调用,走 career 限流桶(20/天)。槽位判断在前端做,后端只管分类。

import { NextResponse } from "next/server";
import { classifyIntakeText } from "@/lib/agents/intake.ts";
import { consumeAgentLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "缺少文字内容。" }, { status: 400 });
  }

  const rl = consumeAgentLimit("career", request.headers);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  try {
    const result = await classifyIntakeText(text);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "识别失败,请重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
