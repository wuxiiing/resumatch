// 职业路径模拟 · 节点实现
// 吃简历 + 可选的方向 → DeepSeek 推演 2-3 条可行路径。
// 结合 knowledge 专业→岗位数据。

import { careerPathSystemPrompt, buildCareerPathUserPrompt } from "./prompt.ts";
import { validateCareerPath, type CareerPath } from "./schema.ts";
import { callDeepSeekJson } from "../deepseek.ts";
import { matchMajor } from "../../knowledge-index.ts";

export async function careerPathNode(input: {
  resumeText: string;
  targetDirection?: string;
}): Promise<CareerPath> {
  const majorHit = matchMajor(input.resumeText);
  return callDeepSeekJson(
    careerPathSystemPrompt,
    buildCareerPathUserPrompt({
      resumeText: input.resumeText,
      targetDirection: input.targetDirection,
      majorJobData: majorHit ? `专业「${majorHit.major}」的适合方向：\n${majorHit.rawBlock}` : undefined
    }),
    validateCareerPath
  );
}
