// 简配 2.0 · 前端共享数据契约 + 本地存储键。
// 形状镜像 lib/agents/*/schema.ts 的节点输出（此处只要类型，不拉验证函数，保持 client 包干净）。
// 「记忆」= 浏览器本地档案（简历+意图持久），不做账号系统；以后上账号时数据结构平移即可。

export type JdSignal = { fromText: string; reads: string };
export type OrgCandidate = { name: string; prob: number; why: string };
export type OrgGuess = { candidates: OrgCandidate[]; note: string };
export type JdAnalysis = {
  jobTitle: string; // ① 从 JD 认出的岗位名（自动命名用；可空）
  orgGuess: OrgGuess | null; // ① 公司/业务线推断（带概率；信号不足为 null）
  realIdentity: string;
  whoTheyWant: string;
  signals: JdSignal[];
  infoGaps: string[];
};

export type ResumeEvidenceItem = { source: string; category: string; claim: string };
export type ResumeEvidence = { summary: string; evidences: ResumeEvidenceItem[] };

export type MatchGap = { need: string; status: string; note: string };
export type Fork = { dependsOn: string; ifYes: string; ifNo: string };
export type MatchJudgment = {
  tier: string; // 目标 / 跳板 / 该绕开（后端定档）
  isBoundary: boolean;
  gaps: MatchGap[];
  reasoning: string;
  tradeoff: string;
  warnings: string[];
  timeHint: string;
  fork: Fork | null;
};

export type ActionPlan = {
  resumeStrategy: { highlight: string; downplay: string };
  interviewTips: string[];
  salaryTip: string;
};

// 方向校准（小简）·「意愿 vs 现实」对照。镜像 lib/agents/career-fit/schema.ts（只要类型，不拉验证函数）。
export type RealisticDirection = { direction: string; strength: string; basis: string };
export type FitGap = { dimension: string; missing: string; whyHard: string };
export type CareerFit = {
  snapshot: string;
  realisticDirections: RealisticDirection[];
  aligned: boolean;
  verdict: string;
  gaps: FitGap[];
  suggestion: string;
};

export type UserIntent = { targetDirection: string; hardNo: string[] };

export type ReportMeta = { position: string; company: string; date: string };

export type AgentReport = {
  meta: ReportMeta;
  jdAnalysis: JdAnalysis;
  resumeEvidence: ResumeEvidence;
  matchJudgment: MatchJudgment;
  actionPlan: ActionPlan;
};

// 简配档案 = 真·记忆：一次设好，换 JD 不用重贴简历。
export type JianpeiProfile = { resumeText: string; resumeName: string; intent: UserIntent };

export const AGENT_REPORT_KEY = "jianpei:last-report"; // sessionStorage：一次分析结果
export const JIANPEI_PROFILE_KEY = "jianpei:profile"; // localStorage：持久档案

// 把模型给的自由文本 status 归一成三态，用于配色与覆盖度统计。
export function statusKind(status: string): "hit" | "partial" | "miss" {
  if (/缺|空白|没有|无相关|不符|未/.test(status)) return "miss";
  if (/命中|具备|对口|符合|满足|较强|强$/.test(status)) return "hit";
  return "partial";
}
