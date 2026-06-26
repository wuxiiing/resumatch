// ① JD 解读节点 · 输出结构与校验
// 校验风格沿用现有 lib/analysis-schema.ts：结构化、明确、出错返回原因字符串。

export type JdSignal = {
  fromText: string; // JD 里的原句或原词
  reads: string; // 它的潜台词
};

export type JdAnalysis = {
  realIdentity: string; // 真身
  whoTheyWant: string; // 它要什么人
  signals: JdSignal[];
  infoGaps: string[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSignal(v: unknown): v is JdSignal {
  return isObject(v) && typeof v.fromText === "string" && typeof v.reads === "string";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function validateJdAnalysis(v: unknown): Result<JdAnalysis> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (typeof v.realIdentity !== "string" || v.realIdentity.trim() === "")
    return { ok: false, error: "realIdentity 缺失或为空" };
  if (typeof v.whoTheyWant !== "string" || v.whoTheyWant.trim() === "")
    return { ok: false, error: "whoTheyWant 缺失或为空" };
  if (!Array.isArray(v.signals) || !v.signals.every(isSignal))
    return { ok: false, error: "signals 结构不正确" };
  if (!isStringArray(v.infoGaps)) return { ok: false, error: "infoGaps 结构不正确" };
  return { ok: true, data: v as JdAnalysis };
}
