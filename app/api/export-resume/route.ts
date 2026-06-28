// 把结构化简历导出为专业排版 docx。接收 { resume: StructuredResume }。
// 不复用 MVP 的 export-word；带 IP 限额（导出）。

import { NextResponse } from "next/server";
import { generateResumeDocx, getResumeExportHeaders } from "@/lib/export-resume";
import { validateStructuredResume } from "@/lib/resume-structured";
import { consumeAgentLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const resumeRaw = isPlainObject(payload) ? payload.resume : undefined;
  const v = validateStructuredResume(resumeRaw);
  if (!v.ok) {
    return NextResponse.json({ error: `简历数据不完整：${v.error}` }, { status: 400 });
  }

  const rl = consumeAgentLimit("edit", request.headers);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  try {
    const buffer = await generateResumeDocx(v.data);
    return new NextResponse(new Uint8Array(buffer), { headers: getResumeExportHeaders(v.data.name) });
  } catch {
    return NextResponse.json({ error: "简历导出失败，请稍后重试。" }, { status: 500 });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
