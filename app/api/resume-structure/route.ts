// 把纯文本简历用 LLM 整理成结构化简历（StructuredResume）。只重组、不编造。
// 供「简历修改」页:一键智能整理 → 结构化编辑 → 专业模板导出。

import { NextResponse } from "next/server";
import { callDeepSeekJson } from "@/lib/agents/deepseek.ts";
import { RESUME_STRUCTURE_SYSTEM, buildStructureUserPrompt, validateStructuredResume } from "@/lib/resume-structured";
import { consumeAgentLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { resumeText?: string };
  try {
    body = (await request.json()) as { resumeText?: string };
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const resumeText = (body.resumeText ?? "").trim();
  if (!resumeText) {
    return NextResponse.json({ error: "缺少简历内容。" }, { status: 400 });
  }

  const rl = consumeAgentLimit("resume", request.headers);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  try {
    const structured = await callDeepSeekJson(
      RESUME_STRUCTURE_SYSTEM,
      buildStructureUserPrompt(resumeText),
      validateStructuredResume,
      { maxTokens: 4000 }
    );
    return NextResponse.json(structured);
  } catch (e) {
    const message = e instanceof Error ? e.message : "整理失败,请重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
