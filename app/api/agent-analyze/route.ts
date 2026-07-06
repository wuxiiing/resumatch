// 2.0 Agent 工作流的 API 入口：把 ①②③④ 工作流接进 Next.js。
// 不动旧 MVP 的 /api/analyze；这是新版独立通路。

import { apiPost } from "@/lib/api-helpers";
import { graph } from "@/lib/agents/graph.ts";
import type { UserIntent } from "@/lib/agents/user-intent.ts";

export const runtime = "nodejs";
// 工作流串行调 4 次 DeepSeek，需要较长时间。
export const maxDuration = 300;

export const POST = apiPost({ credit: "analyze", requireKey: "DEEPSEEK_API_KEY" }, async (body) => {
  const resumeText = String(body.resumeText ?? "").trim();
  const jobDescription = String(body.jobDescription ?? "").trim();
  if (!resumeText || !jobDescription) throw new Error("缺少简历文本或岗位 JD。");

  const userIntent: UserIntent = (body.userIntent as UserIntent) ?? { targetDirection: "", hardNo: [] };

  const result = await graph.invoke({ resumeText, jobDescription, userIntent });
  return {
    jdAnalysis: result.jdAnalysis,
    resumeEvidence: result.resumeEvidence,
    matchJudgment: result.matchJudgment,
    actionPlan: result.actionPlan,
  };
});
