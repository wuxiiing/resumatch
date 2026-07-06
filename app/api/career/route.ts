// 方向校准 API：独立单节点，吃简历+意愿 → 出「意愿 vs 现实」对照。
// 不碰 MVP、不碰 agent-analyze 主研判链。

import { apiPost } from "@/lib/api-helpers";
import { careerFitNode } from "@/lib/agents/career-fit/node.ts";

export const runtime = "nodejs";
export const maxDuration = 120;

export const POST = apiPost({ bucket: "career", requireKey: "DEEPSEEK_API_KEY" }, async (body) => {
  const resumeText = String(body.resumeText ?? "").trim();
  if (!resumeText) throw new Error("缺少简历文本。");

  const targetDirection = String(body.targetDirection ?? "").trim();
  const hardNo = Array.isArray(body.hardNo) ? body.hardNo.filter((x): x is string => typeof x === "string") : [];

  return careerFitNode({ resumeText, targetDirection, hardNo });
});
