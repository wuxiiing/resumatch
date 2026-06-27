// 方向校准节点 · 输出结构与校验
// 「意愿 vs 现实」对照：从简历推断现实可达方向，与用户意愿对齐 → 确认 / 错位预警。

export type RealisticDirection = {
  direction: string; // 简历客观指向的方向
  strength: string; // 支撑强度：强 / 中 / 弱
  basis: string; // 简历里的依据
};

export type FitGap = {
  dimension: string; // 维度：技能 / 经验 / 项目 / 学历 / 行业 …
  missing: string; // 差什么
  whyHard: string; // 为什么短期难补（定性，不给周期）
};

export type CareerFit = {
  snapshot: string; // 当前定位：一句话总结简历现状
  realisticDirections: RealisticDirection[]; // 简历能托起的方向（2-3）
  aligned: boolean; // 意愿 vs 现实 是否对齐
  verdict: string; // 对照结论一句话
  gaps: FitGap[]; // 仅错位时有内容；对齐时空数组
  suggestion: string; // 一个方向性建议（定性）
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

function isStringTriples(v: unknown, keys: [string, string, string]): boolean {
  return (
    Array.isArray(v) &&
    v.every(
      (x) => isObject(x) && keys.every((k) => typeof x[k] === "string")
    )
  );
}

export function validateCareerFit(v: unknown): Result<CareerFit> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (!isNonEmptyString(v.snapshot)) return { ok: false, error: "snapshot 缺失或为空" };
  if (!isStringTriples(v.realisticDirections, ["direction", "strength", "basis"]))
    return { ok: false, error: "realisticDirections 结构不正确" };
  if (typeof v.aligned !== "boolean") return { ok: false, error: "aligned 必须是 boolean" };
  if (!isNonEmptyString(v.verdict)) return { ok: false, error: "verdict 缺失或为空" };
  if (!isStringTriples(v.gaps, ["dimension", "missing", "whyHard"]))
    return { ok: false, error: "gaps 结构不正确" };
  if (typeof v.suggestion !== "string") return { ok: false, error: "suggestion 必须是 string" };
  return { ok: true, data: v as CareerFit };
}
