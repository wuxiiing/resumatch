// LangGraph 编排：① JD 解读 → ② 简历证据 → ③ 匹配判断 → ④ 应对策略（串行）。
// 加节点 = addNode + addEdge + 往 State 加字段，主干不用动——这就是"好扩展"的样子。

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { jdAnalysisNode } from "./jd-analysis/node.ts";
import type { JdAnalysis } from "./jd-analysis/schema.ts";
import { resumeEvidenceNode } from "./resume-evidence/node.ts";
import type { ResumeEvidence } from "./resume-evidence/schema.ts";
import { matchJudgeNode } from "./match-judge/node.ts";
import type { MatchJudgment } from "./match-judge/schema.ts";
import { actionPlanNode } from "./action-plan/node.ts";
import type { ActionPlan } from "./action-plan/schema.ts";
import type { UserIntent } from "./user-intent.ts";

// 共享状态：3 个输入（JD / 简历 / 用户意图）+ 四个节点的产出。
export const AgentState = Annotation.Root({
  jobDescription: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
  resumeText: Annotation<string>({ reducer: (_a, b) => b, default: () => "" }),
  userIntent: Annotation<UserIntent>({
    reducer: (_a, b) => b,
    default: () => ({ targetDirection: "", hardNo: [] }),
  }),
  jdAnalysis: Annotation<JdAnalysis | null>({ reducer: (_a, b) => b, default: () => null }),
  resumeEvidence: Annotation<ResumeEvidence | null>({ reducer: (_a, b) => b, default: () => null }),
  matchJudgment: Annotation<MatchJudgment | null>({ reducer: (_a, b) => b, default: () => null }),
  actionPlan: Annotation<ActionPlan | null>({ reducer: (_a, b) => b, default: () => null }),
});

export const graph = new StateGraph(AgentState)
  .addNode("analyzeJd", jdAnalysisNode)
  .addNode("extractEvidence", resumeEvidenceNode)
  .addNode("matchJudge", matchJudgeNode)
  .addNode("planActions", actionPlanNode)
  .addEdge(START, "analyzeJd")
  .addEdge("analyzeJd", "extractEvidence")
  .addEdge("extractEvidence", "matchJudge")
  .addEdge("matchJudge", "planActions")
  .addEdge("planActions", END)
  .compile();
