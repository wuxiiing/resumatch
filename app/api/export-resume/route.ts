import { NextResponse } from "next/server";
import { generateResumeDocx, getResumeExportHeaders } from "@/lib/export-resume";
import { consumeAgentLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// 接收简历工作副本纯文本，返回 docx。不复用 /api/export-word（那是 MVP 分析报告专用）。
export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!isPlainObject(payload) || typeof payload.resumeText !== "string") {
      return NextResponse.json({ error: "缺少简历内容。" }, { status: 400 });
    }

    const resumeText = payload.resumeText;
    if (resumeText.trim() === "") {
      return NextResponse.json({ error: "简历内容为空。" }, { status: 400 });
    }

    const rl = consumeAgentLimit("edit", request.headers);
    if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

    const name = typeof payload.name === "string" ? payload.name : "简历";
    const buffer = await generateResumeDocx(resumeText);

    return new NextResponse(new Uint8Array(buffer), {
      headers: getResumeExportHeaders(name)
    });
  } catch {
    return NextResponse.json({ error: "简历导出失败，请稍后重试。" }, { status: 500 });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
