// 方向校准 API：独立单节点，吃简历+意愿 → 出「意愿 vs 现实」对照。
// 不碰 MVP、不碰 agent-analyze 主研判链。

import { NextResponse } from "next/server";

import { careerFitNode } from "@/lib/agents/career-fit/node.ts";

export const runtime = "nodejs";
export const maxDuration = 120;

type CareerRequest = {
  resumeText?: string;
  targetDirection?: string;
  hardNo?: string[];
};

export async function POST(request: Request) {
  let body: CareerRequest;
  try {
    body = (await request.json()) as CareerRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim();
  if (!resumeText) {
    return NextResponse.json({ error: "缺少简历文本。" }, { status: 400 });
  }

  const targetDirection = body.targetDirection?.trim() ?? "";
  const hardNo = Array.isArray(body.hardNo)
    ? body.hardNo.filter((x): x is string => typeof x === "string")
    : [];

  try {
    const result = await careerFitNode({ resumeText, targetDirection, hardNo });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "方向校准失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
