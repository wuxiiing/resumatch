// 入场分诊：用户往对话框丢的「一段文字」是什么？（JD / 求职目标 / 简历文本 / 其他）
// 分类优先走启发式规则（省一次 LLM 调用），命中不了才走 DeepSeek。

import { callDeepSeekJson } from "./deepseek.ts";

export type TextKind = "jd" | "goal" | "resume" | "other";
export type IntakeClassification = { kind: TextKind; goal: string };

const INTAKE_SYSTEM = `你是求职应用的输入分诊器。判断用户丢进输入框的一段文字属于哪类:
- "jd": 招聘岗位描述(岗位职责/任职要求/薪资等,通常是粘贴来的)
- "goal": 求职目标或意向(如"我想投AI产品经理""帮我看看适不适合去字节")
- "resume": 简历正文(个人经历/教育/技能的自述文本)
- "other": 都不是(闲聊/提问等)
若文字里带有求职意向,提炼成一句话放 goal;没有则 goal 给空字符串。
只输出 JSON: {"kind":"jd|goal|resume|other","goal":""}`;

type Validation<T> = { ok: true; data: T } | { ok: false; error: string };

export function validateClassification(v: unknown): Validation<IntakeClassification> {
  if (typeof v !== "object" || v === null) return { ok: false, error: "非 object" };
  const o = v as Record<string, unknown>;
  const kinds: TextKind[] = ["jd", "goal", "resume", "other"];
  if (typeof o.kind !== "string" || !kinds.includes(o.kind as TextKind))
    return { ok: false, error: "kind 不合法" };
  if (typeof o.goal !== "string") return { ok: false, error: "goal 缺失" };
  return { ok: true, data: { kind: o.kind as TextKind, goal: o.goal } };
}

// ── 启发式短路：文本明显是 JD 或简历时跳过 LLM，省 ~2-4s + 一次 API 费 ──

/** JD 信号词：匹配 ≥2 个 → 直接判 jd */
const JD_SIGNALS = [
  /岗位职责/, /工作职责/, /职位描述/, /岗位描述/, /工作内容/,
  /任职要求/, /岗位要求/, /职位要求/, /能力要求/, /我们希望你/,
  /薪资(范围)?/, /福利/,
];

/** 简历信号词：匹配 ≥2 个 → 直接判 resume */
const RESUME_SIGNALS = [
  /教育(背景|经历)/, /学历/, /毕业(院校|于|时间)/,
  /工作(经历|经验)/, /实习(经历|经验)/, /项目(经历|经验)/,
  /自我(评价|介绍|描述)/, /技能(证书)?/,
  /(联系电话|手机|邮箱).{0,10}\d/, // 联系方式
];

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function heuristicClassify(text: string): IntakeClassification | null {
  // 太短的文本不可能有明显信号，交给 LLM
  if (text.length < 80) return null;

  const jdHits = countMatches(text, JD_SIGNALS);
  const resumeHits = countMatches(text, RESUME_SIGNALS);

  // JD 信号 ≥2 且明显比简历信号多 → 直接判 JD
  if (jdHits >= 2 && jdHits > resumeHits) {
    return { kind: "jd", goal: "" };
  }

  // 简历信号 ≥2 且明显比 JD 信号多 → 直接判 resume
  if (resumeHits >= 2 && resumeHits > jdHits) {
    return { kind: "resume", goal: "" };
  }

  // 信号不够强或不明确 → 回退 LLM
  return null;
}

export function classifyIntakeText(text: string): Promise<IntakeClassification> {
  const heuristic = heuristicClassify(text);
  if (heuristic) return Promise.resolve(heuristic);

  return callDeepSeekJson(
    INTAKE_SYSTEM,
    `分类这段输入:\n\n${text.slice(0, 6000)}`,
    validateClassification,
    { maxTokens: 200 }
  );
}

// 槽位状态机移至 ./intake-steps.ts(纯逻辑,前端也要用);此处转发保持旧引用不变。
export { nextIntakeStep, type IntakeSlots, type IntakeStep } from "./intake-steps.ts";
