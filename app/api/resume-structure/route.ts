// 把纯文本简历用 LLM 整理成结构化简历（StructuredResume）。只重组、不编造。
// 供「简历修改」页：一键智能整理 → 结构化编辑 → 专业模板导出。

import { apiPost } from "@/lib/api-helpers";
import { callDeepSeekJson } from "@/lib/agents/deepseek.ts";
import { RESUME_STRUCTURE_SYSTEM, buildStructureUserPrompt, validateStructuredResume } from "@/lib/resume-structured";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = apiPost({ credit: "structure", requireKey: "DEEPSEEK_API_KEY" }, async (body) => {
  const resumeText = String(body.resumeText ?? "").trim();
  if (!resumeText) throw new Error("缺少简历内容。");

  return callDeepSeekJson(
    RESUME_STRUCTURE_SYSTEM,
    buildStructureUserPrompt(resumeText),
    validateStructuredResume,
    { maxTokens: 4000 }
  );
});
