// ② 简历证据提取节点 · 输出结构与校验

export type ResumeEvidenceItem = {
  source: string; // 简历原文片段
  category: string; // 证据类型
  claim: string; // 能证明什么
};

export type ResumeEvidence = {
  summary: string; // 核心牌面
  evidences: ResumeEvidenceItem[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isEvidenceItem(v: unknown): v is ResumeEvidenceItem {
  return (
    isObject(v) &&
    typeof v.source === "string" &&
    typeof v.category === "string" &&
    typeof v.claim === "string"
  );
}

export function validateResumeEvidence(v: unknown): Result<ResumeEvidence> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (typeof v.summary !== "string" || v.summary.trim() === "")
    return { ok: false, error: "summary 缺失或为空" };
  if (!Array.isArray(v.evidences) || !v.evidences.every(isEvidenceItem))
    return { ok: false, error: "evidences 结构不正确" };
  return { ok: true, data: v as ResumeEvidence };
}
