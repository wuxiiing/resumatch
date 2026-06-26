// ③ 匹配判断节点 · 节点实现
// 调模型拿"信号 + 权衡"（带重试），再用后端固定规则定档——档位不受 LLM 飘动影响。

import { matchJudgeSystemPrompt, buildMatchJudgeUserPrompt } from "./prompt.ts";
import { validateModelMatchOutput, decideVerdict, type MatchJudgment } from "./schema.ts";
import type { JdAnalysis } from "../jd-analysis/schema.ts";
import type { ResumeEvidence } from "../resume-evidence/schema.ts";
import type { UserIntent } from "../user-intent.ts";
import { callDeepSeekJson } from "../deepseek.ts";

export async function matchJudgeNode(state: {
  jdAnalysis: JdAnalysis | null;
  resumeEvidence: ResumeEvidence | null;
  userIntent: UserIntent;
}): Promise<{ matchJudgment: MatchJudgment }> {
  const model = await callDeepSeekJson(
    matchJudgeSystemPrompt,
    buildMatchJudgeUserPrompt({
      jdAnalysis: state.jdAnalysis,
      resumeEvidence: state.resumeEvidence,
      userIntent: state.userIntent,
    }),
    validateModelMatchOutput
  );

  // 后端定档：同样的信号 → 同样的档位（治"摆动"的关键）
  const { tier, isBoundary } = decideVerdict(model.signals);

  return { matchJudgment: { ...model, tier, isBoundary } };
}
