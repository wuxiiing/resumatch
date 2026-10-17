// LangGraph 编排：①JD 解读 与 ②简历证据 并行；① 之后 ⑤背调（要用 ① 推断的公司名）→ ③匹配判断（等②⑤都完成）→ ④应对策略。
// ② 只读 resumeText、不依赖 ①，故与 ① 并行跑，省一次 LLM 往返的串行等待（约 15-20s）。
// ③ 用"等全部到齐"的合流边（数组起点）：分开两条边的话，②先到会让 ③ 提前跑一次、背调到了再跑一次。
// 加节点 = addNode + addEdge + 往 State 加字段，主干不用动——这就是"好扩展"的样子。

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { jdAnalysisNode } from "./jd-analysis/node.ts";
import type { JdAnalysis } from "./jd-analysis/schema.ts";
import { resumeEvidenceNode } from "./resume-evidence/node.ts";
import type { ResumeEvidence } from "./resume-evidence/schema.ts";
import { matchJudgeNode } from "./match-judge/node.ts";
import type { MatchJudgment } from "./match-judge/schema.ts";
import { actionPlanNode } from "./action-plan/node.ts";
import { reconNode } from "./recon/node.ts";
import type { Recon } from "./recon/schema.ts";
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
  recon: Annotation<Recon | null>({ reducer: (_a, b) => b, default: () => null }),
  matchJudgment: Annotation<MatchJudgment | null>({ reducer: (_a, b) => b, default: () => null }),
  actionPlan: Annotation<ActionPlan | null>({ reducer: (_a, b) => b, default: () => null }),
});

export const graph = new StateGraph(AgentState)
  .addNode("analyzeJd", jdAnalysisNode)
  .addNode("extractEvidence", resumeEvidenceNode)
  .addNode("runRecon", reconNode)
  .addNode("matchJudge", matchJudgeNode)
  .addNode("planActions", actionPlanNode)
  .addEdge(START, "analyzeJd") // ① 与 ② 都从 START 出发 → 并行
  .addEdge(START, "extractEvidence")
  .addEdge("analyzeJd", "runRecon") // ⑤ 等 ① 认出公司再搜
  .addEdge(["extractEvidence", "runRecon"], "matchJudge") // ③ 等 ② 和 ⑤ 都到齐（⑤ 在 ① 之后，① 自然也齐了）
  .addEdge("matchJudge", "planActions")
  .addEdge("planActions", END)
  .compile();
