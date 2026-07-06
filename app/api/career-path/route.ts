// 职业路径模拟 API：吃简历 → 推演 2-3 条可行晋升路径。
// 不碰 MVP、不碰 agent-analyze 主研判链。

import { apiPost } from "@/lib/api-helpers";
import { careerPathNode } from "@/lib/agents/career-path/node.ts";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = apiPost({ credit: "career", requireKey: "DEEPSEEK_API_KEY" }, async (body) => {
  const resumeText = String(body.resumeText ?? "").trim();
  if (!resumeText) throw new Error("缺少简历文本。");

  const targetDirection = String(body.targetDirection ?? "").trim() || undefined;
  return careerPathNode({ resumeText, targetDirection });
});
