// ⑤ 背调节点 · 输出结构与校验
// 背调回答"是不是坑"：只依据一次联网搜索的结果，查不到也是信号。和判级（方向）是两个维度。

export type RiskLevel = "低" | "中" | "高" | "无法判断";
export type Confidence = "高" | "中" | "低";

// 模型写的部分
export type ReconFindings = {
  company: string; // 搜索结果里认定的公司主体；查不到给空字符串
  found: boolean; // 公开渠道是否查到这家公司
  basics: string; // 公司是谁：规模、业务、成立时间、近况
  reputation: string; // 口碑与工作体验
  jobAuthenticity: string; // 岗位真不真（长期挂 / 反复重发）
  registry: string; // 工商与关联：法人、实控人、关联公司、经营异常
  complaints: string; // 投诉与司法
  riskLevel: RiskLevel;
  confidence: Confidence;
  riskWhy: string;
  tips: string; // 给求职者的提醒（查不到时写清新公司 / 假公司两种可能和核实办法）
};

export type ReconSource = { title: string; url: string };

// 完整背调 = 模型写的 + 程序补的（搜了什么名字、来源）；没认出公司或搜索失败时只给一句说明
export type Recon =
  | ({ status: "ok"; searchedName: string; sources: ReconSource[] } & ReconFindings)
  | { status: "skipped" | "failed"; searchedName: string; note: string };

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const risks = new Set<RiskLevel>(["低", "中", "高", "无法判断"]);
const confidences = new Set<Confidence>(["高", "中", "低"]);
const TEXT_FIELDS = ["company", "basics", "reputation", "jobAuthenticity", "registry", "complaints", "riskWhy", "tips"] as const;

export function validateReconFindings(v: unknown): Result<ReconFindings> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return { ok: false, error: "顶层不是 JSON object" };
  const o = v as Record<string, unknown>;
  for (const k of TEXT_FIELDS) if (typeof o[k] !== "string") return { ok: false, error: `${k} 必须是字符串` };
  if (typeof o.found !== "boolean") return { ok: false, error: "found 必须是布尔值" };
  if (!risks.has(o.riskLevel as RiskLevel)) return { ok: false, error: "riskLevel 不在选项里" };
  if (!confidences.has(o.confidence as Confidence)) return { ok: false, error: "confidence 不在选项里" };
  return { ok: true, data: o as ReconFindings };
}
