// ④ 应对策略节点 · 节点实现
// 吃 ①②③的产出 + 用户意图，调模型（带重试）出"怎么打"。

import { actionPlanSystemPrompt, buildActionPlanUserPrompt } from "./prompt.ts";
import { validateActionPlan, type ActionPlan } from "./schema.ts";
import type { JdAnalysis } from "../jd-analysis/schema.ts";
import type { ResumeEvidence } from "../resume-evidence/schema.ts";
import type { MatchJudgment } from "../match-judge/schema.ts";
import type { UserIntent } from "../user-intent.ts";
import { callDeepSeekJson } from "../deepseek.ts";

export async function actionPlanNode(state: {
  jdAnalysis: JdAnalysis | null;
  resumeEvidence: ResumeEvidence | null;
  matchJudgment: MatchJudgment | null;
  userIntent: UserIntent;
}): Promise<{ actionPlan: ActionPlan }> {
  const actionPlan = await callDeepSeekJson(
    actionPlanSystemPrompt,
    buildActionPlanUserPrompt({
      jdAnalysis: state.jdAnalysis,
      resumeEvidence: state.resumeEvidence,
      matchJudgment: state.matchJudgment,
      userIntent: state.userIntent,
    }),
    validateActionPlan
  );
  return { actionPlan };
}
