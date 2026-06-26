// 2.0 Agent 工作流的 API 入口：把 ①②③④ 工作流接进 Next.js。
// 不动旧 MVP 的 /api/analyze；这是新版独立通路。

import { NextResponse } from "next/server";

import { graph } from "@/lib/agents/graph.ts";
import type { UserIntent } from "@/lib/agents/user-intent.ts";

export const runtime = "nodejs";
// 工作流串行调 4 次 DeepSeek，需要较长时间（Vercel 生产需 Pro 才能放宽到这个时长）。
export const maxDuration = 300;

type AgentAnalyzeRequest = {
  resumeText?: string;
  jobDescription?: string;
  userIntent?: UserIntent;
};

export async function POST(request: Request) {
  let body: AgentAnalyzeRequest;
  try {
    body = (await request.json()) as AgentAnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim();
  const jobDescription = body.jobDescription?.trim();

  if (!resumeText || !jobDescription) {
    return NextResponse.json({ error: "缺少简历文本或岗位 JD。" }, { status: 400 });
  }

  const userIntent: UserIntent = body.userIntent ?? { targetDirection: "", hardNo: [] };

  try {
    const result = await graph.invoke({ resumeText, jobDescription, userIntent });
    return NextResponse.json({
      jdAnalysis: result.jdAnalysis,
      resumeEvidence: result.resumeEvidence,
      matchJudgment: result.matchJudgment,
      actionPlan: result.actionPlan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 分析失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
