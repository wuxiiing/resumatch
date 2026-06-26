// ③ 匹配判断节点 · 输出结构、校验、后端定档规则
// 立体判断：主档（后端定）+ 条件分叉 fork + 避雷 warnings + 时限 timeHint。

export type MatchGap = { need: string; status: string; note: string };

export type DirectionFit = "对口" | "偏离" | "冲突";
export type GrowthRoom = "有" | "少" | "无";
export type MatchSignals = {
  directionFit: DirectionFit;
  hitsHardNo: boolean;
  growthRoom: GrowthRoom;
};
export type VerdictTier = "目标" | "跳板" | "该绕开";

// 条件分叉：当判断取决于用户某个还没定的选择时（如愿不愿跨行业）
export type Fork = {
  dependsOn: string; // 取决于你哪个未定的选择
  ifYes: string; // 如果是 → 怎么看
  ifNo: string; // 如果否 → 怎么看
};

export type ModelMatchOutput = {
  gaps: MatchGap[];
  signals: MatchSignals;
  reasoning: string;
  tradeoff: string;
  warnings: string[]; // 避雷：从 JD 嗅的风险（可空数组）
  timeHint: string; // 时限提醒，尤其跳板（不适用给空字符串）
  fork: Fork | null; // 条件分叉（边界/取决于用户选择时给，否则 null）
};

// 完整判断 = 模型输出 + 后端定的档
export type MatchJudgment = ModelMatchOutput & {
  tier: VerdictTier;
  isBoundary: boolean;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
function isGap(v: unknown): v is MatchGap {
  return (
    isObject(v) &&
    typeof v.need === "string" &&
    typeof v.status === "string" &&
    typeof v.note === "string"
  );
}
const directionFits = new Set<DirectionFit>(["对口", "偏离", "冲突"]);
const growthRooms = new Set<GrowthRoom>(["有", "少", "无"]);
function isSignals(v: unknown): v is MatchSignals {
  return (
    isObject(v) &&
    typeof v.directionFit === "string" &&
    directionFits.has(v.directionFit as DirectionFit) &&
    typeof v.hitsHardNo === "boolean" &&
    typeof v.growthRoom === "string" &&
    growthRooms.has(v.growthRoom as GrowthRoom)
  );
}
function isFork(v: unknown): v is Fork {
  return (
    isObject(v) &&
    typeof v.dependsOn === "string" &&
    typeof v.ifYes === "string" &&
    typeof v.ifNo === "string"
  );
}

export function validateModelMatchOutput(v: unknown): Result<ModelMatchOutput> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (!Array.isArray(v.gaps) || !v.gaps.every(isGap))
    return { ok: false, error: "gaps 结构不正确" };
  if (!isSignals(v.signals)) return { ok: false, error: "signals 结构不正确（含枚举值）" };
  if (typeof v.reasoning !== "string" || v.reasoning.trim() === "")
    return { ok: false, error: "reasoning 缺失或为空" };
  if (typeof v.tradeoff !== "string" || v.tradeoff.trim() === "")
    return { ok: false, error: "tradeoff 缺失或为空" };
  if (!isStringArray(v.warnings)) return { ok: false, error: "warnings 必须是字符串数组" };
  if (typeof v.timeHint !== "string") return { ok: false, error: "timeHint 必须是字符串" };
  if (v.fork !== null && !isFork(v.fork))
    return { ok: false, error: "fork 必须是 null 或合法分叉对象" };
  return { ok: true, data: v as ModelMatchOutput };
}

// 后端定档：确定性规则，同样的信号永远得到同样的档位（治"摆动"的关键）。
export function decideVerdict(s: MatchSignals): { tier: VerdictTier; isBoundary: boolean } {
  if (s.directionFit === "对口") return { tier: "目标", isBoundary: false };
  if (s.growthRoom === "无") return { tier: "该绕开", isBoundary: false };
  return { tier: "跳板", isBoundary: true };
}
