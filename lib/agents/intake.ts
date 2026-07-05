// 入场分诊:用户往对话框丢的「一段文字」是什么?(JD / 求职目标 / 简历文本 / 其他)
// 分类走 DeepSeek(便宜快);「缺啥问啥」的追问文案是确定性的,不烧模型,集中在 nextIntakeStep 改。

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

export function classifyIntakeText(text: string): Promise<IntakeClassification> {
  return callDeepSeekJson(
    INTAKE_SYSTEM,
    `分类这段输入:\n\n${text.slice(0, 6000)}`,
    validateClassification,
    { maxTokens: 200 }
  );
}

// 槽位状态机移至 ./intake-steps.ts(纯逻辑,前端也要用);此处转发保持旧引用不变。
export { nextIntakeStep, type IntakeSlots, type IntakeStep } from "./intake-steps.ts";
