// ④ 应对策略节点 · 输出结构与校验

export type ResumeStrategy = {
  highlight: string; // 扬长
  downplay: string; // 避短
};

export type InterviewFocusItem = {
  area: string; // 考察领域（如 "算法/技术面"）
  weight: number; // 大致比重（0-100）
  reason: string; // JD 里的依据——为什么这块会考、考多深
};

export type ActionPlan = {
  resumeStrategy: ResumeStrategy;
  interviewTips: string[];
  interviewFocus: InterviewFocusItem[]; // 面试考点权重拆解（3-5 项）
  salaryTip: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isInterviewFocus(v: unknown): v is InterviewFocusItem[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (x) =>
      isObject(x) &&
      typeof x.area === "string" &&
      typeof x.weight === "number" &&
      x.weight >= 0 &&
      x.weight <= 100 &&
      typeof x.reason === "string"
  );
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
  if (!isInterviewFocus(v.interviewFocus))
    return { ok: false, error: "interviewFocus 结构不正确（需为数组，每项含 area/weight/reason，weight 0-100）" };
  if (typeof v.salaryTip !== "string" || v.salaryTip.trim() === "")
    return { ok: false, error: "salaryTip 缺失或为空" };
  return { ok: true, data: v as ActionPlan };
}
