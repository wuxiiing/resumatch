// ① JD 解读节点 · 输出结构与校验
// 校验风格沿用现有 lib/analysis-schema.ts：结构化、明确、出错返回原因字符串。

export type JdSignal = {
  fromText: string; // JD 里的原句或原词
  reads: string; // 它的潜台词
};

export type OrgCandidate = {
  name: string; // 推断的公司/业务线
  prob: number; // 0-100
  why: string; // 依据（引 JD 原词）
};

export type OrgGuess = {
  candidates: OrgCandidate[];
  note: string; // "推断非确定"提醒
};

export type JdAnalysis = {
  jobTitle: string; // 从 JD 认出的岗位名（可为空字符串）
  orgGuess: OrgGuess | null; // 公司/业务线推断；信号不足为 null
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

function isOrgCandidate(v: unknown): v is OrgCandidate {
  return (
    isObject(v) &&
    typeof v.name === "string" &&
    typeof v.prob === "number" &&
    v.prob >= 0 &&
    v.prob <= 100 &&
    typeof v.why === "string"
  );
}

export function validateJdAnalysis(v: unknown): Result<JdAnalysis> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (typeof v.jobTitle !== "string") return { ok: false, error: "jobTitle 缺失（可为空字符串但必须存在）" };
  if (v.orgGuess !== null && v.orgGuess !== undefined) {
    const og = v.orgGuess;
    if (
      !isObject(og) ||
      typeof og.note !== "string" ||
      !Array.isArray(og.candidates) ||
      og.candidates.length === 0 ||
      og.candidates.length > 3 ||
      !og.candidates.every(isOrgCandidate)
    )
      return { ok: false, error: "orgGuess 结构不正确（需 candidates(1-3条,含name/prob/why) + note，或 null）" };
  } else {
    (v as Record<string, unknown>).orgGuess = null; // 缺省归一为 null
  }
  if (typeof v.realIdentity !== "string" || v.realIdentity.trim() === "")
    return { ok: false, error: "realIdentity 缺失或为空" };
  if (typeof v.whoTheyWant !== "string" || v.whoTheyWant.trim() === "")
    return { ok: false, error: "whoTheyWant 缺失或为空" };
  if (!Array.isArray(v.signals) || !v.signals.every(isSignal))
    return { ok: false, error: "signals 结构不正确" };
  if (!isStringArray(v.infoGaps)) return { ok: false, error: "infoGaps 结构不正确" };
  return { ok: true, data: v as JdAnalysis };
}
