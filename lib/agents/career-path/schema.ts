// 职业路径模拟 · 输出结构与校验

export type PathStep = {
  position: string; // 岗位名（如 "AI产品助理"）
  feasibility: "高" | "中" | "需补课"; // 这份简历当前托得起这一步的概率
  basis: string; // 简历里什么证据支撑这一步
  gapIfAny?: string; // 差什么（feasibility 非"高"时必填，定性不给时间）
};

export type CareerPath = {
  snapshot: string; // 一句话：这份简历现在的真实定位
  paths: {
    label: string; // 路径名（如 "深耕产品线"、"转技术侧"）
    rationale: string; // 为什么推荐这条路
    steps: PathStep[]; // 2-3 步
  }[];
  caveat: string; // 免责声明
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPathStep(v: unknown): v is PathStep {
  if (!isObject(v)) return false;
  if (typeof v.position !== "string" || !["高", "中", "需补课"].includes(v.feasibility as string)) return false;
  if (typeof v.basis !== "string") return false;
  if (v.gapIfAny !== undefined && typeof v.gapIfAny !== "string") return false;
  return true;
}

export function validateCareerPath(v: unknown): Result<CareerPath> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (typeof v.snapshot !== "string") return { ok: false, error: "snapshot 缺失" };
  if (!Array.isArray(v.paths) || v.paths.length === 0) return { ok: false, error: "paths 缺失或为空" };
  for (let i = 0; i < v.paths.length; i++) {
    const p = v.paths[i];
    if (!isObject(p)) return { ok: false, error: `paths[${i}] 不是 object` };
    if (typeof p.label !== "string") return { ok: false, error: `paths[${i}].label 缺失` };
    if (typeof p.rationale !== "string") return { ok: false, error: `paths[${i}].rationale 缺失` };
    if (!Array.isArray(p.steps) || p.steps.length < 2) return { ok: false, error: `paths[${i}].steps 需至少 2 步` };
    for (let j = 0; j < p.steps.length; j++) {
      if (!isPathStep(p.steps[j])) return { ok: false, error: `paths[${i}].steps[${j}] 结构不正确` };
    }
  }
  if (typeof v.caveat !== "string") return { ok: false, error: "caveat 缺失" };
  return { ok: true, data: v as CareerPath };
}
