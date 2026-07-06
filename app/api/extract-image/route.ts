// 图片入场:简历图 → 结构化简历;JD 截图 → 岗位全文;其他 → 一句话说明。
// 豆包视觉一次调用完成分诊 + 抽取(lib/agents/vision-intake)。

import { NextResponse } from "next/server";
import { extractIntakeImage } from "@/lib/agents/vision-intake.ts";
import { consumeCredits } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { imageDataUrl?: string };
  try {
    body = (await request.json()) as { imageDataUrl?: string };
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const imageDataUrl = (body.imageDataUrl ?? "").trim();
  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "缺少图片(需 data:image/* 的 base64 data URL)。" }, { status: 400 });
  }

  const rl = consumeCredits("image", request.headers);
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });

  try {
    const result = await extractIntakeImage(imageDataUrl);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "图片解析失败,请重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
