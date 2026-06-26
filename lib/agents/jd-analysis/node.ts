// ① JD 解读节点 · 节点实现
// 节点很薄：组 prompt → 调共享的 callDeepSeekJson（带重试+校验）→ 写回 state。

import { jdSystemPrompt, buildJdUserPrompt } from "./prompt.ts";
import { validateJdAnalysis, type JdAnalysis } from "./schema.ts";
import { callDeepSeekJson } from "../deepseek.ts";

export async function jdAnalysisNode(state: {
  jobDescription: string;
}): Promise<{ jdAnalysis: JdAnalysis }> {
  const jdAnalysis = await callDeepSeekJson(
    jdSystemPrompt,
    buildJdUserPrompt(state.jobDescription),
    validateJdAnalysis
  );
  return { jdAnalysis };
}
