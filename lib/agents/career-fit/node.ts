// 方向校准节点 · 节点实现
// 薄节点：组 prompt → callDeepSeekJson（带重试+校验）→ 返回结果。
// 独立单节点，不进主研判 graph。

import { careerFitSystemPrompt, buildCareerFitUserPrompt } from "./prompt.ts";
import { validateCareerFit, type CareerFit } from "./schema.ts";
import { callDeepSeekJson } from "../deepseek.ts";
import { matchMajor } from "../../knowledge-index.ts";

export async function careerFitNode(input: {
  resumeText: string;
  targetDirection: string;
  hardNo: string[];
}): Promise<CareerFit> {
  // knowledge: 从简历中检测专业名，匹配岗位库
  const majorHit = matchMajor(input.resumeText);

  return callDeepSeekJson(
    careerFitSystemPrompt,
    buildCareerFitUserPrompt(input, majorHit),
    validateCareerFit
  );
}
