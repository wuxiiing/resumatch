// ④ 应对策略节点 · 输出结构与校验

export type ResumeStrategy = {
  highlight: string; // 扬长
  downplay: string; // 避短
};

export type ActionPlan = {
  resumeStrategy: ResumeStrategy;
  interviewTips: string[];
  salaryTip: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function validateActionPlan(v: unknown): Result<ActionPlan> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (
    !isObject(v.resumeStrategy) ||
    typeof v.resumeStrategy.highlight !== "string" ||
    typeof v.resumeStrategy.downplay !== "string"
  )
    return { ok: false, error: "resumeStrategy 结构不正确" };
  if (!isStringArray(v.interviewTips))
    return { ok: false, error: "interviewTips 结构不正确" };
  if (typeof v.salaryTip !== "string" || v.salaryTip.trim() === "")
    return { ok: false, error: "salaryTip 缺失或为空" };
  return { ok: true, data: v as ActionPlan };
}
