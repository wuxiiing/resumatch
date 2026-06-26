// ② 简历证据提取节点 · 节点实现

import { resumeEvidenceSystemPrompt, buildResumeEvidenceUserPrompt } from "./prompt.ts";
import { validateResumeEvidence, type ResumeEvidence } from "./schema.ts";
import { callDeepSeekJson } from "../deepseek.ts";

export async function resumeEvidenceNode(state: {
  resumeText: string;
}): Promise<{ resumeEvidence: ResumeEvidence }> {
  const resumeEvidence = await callDeepSeekJson(
    resumeEvidenceSystemPrompt,
    buildResumeEvidenceUserPrompt(state.resumeText),
    validateResumeEvidence
  );
  return { resumeEvidence };
}
