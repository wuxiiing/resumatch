// 结构化简历：把「一坨纯文本」变成有层次的简历——姓名 / 定位 / 联系方式 / 分块条目。
// 用于专业模板导出 + 结构化编辑。LLM 把纯文本解析成此结构（只重组、不编造）。

export type ResumeEntry = { heading: string; meta: string; bullets: string[] };
export type ResumeSection = { title: string; entries: ResumeEntry[] };
export type StructuredResume = {
  name: string;
  headline: string; // 一句话定位 / 头衔
  contacts: string[]; // 城市 / 电话 / 邮箱 / GitHub 等
  sections: ResumeSection[];
};

export const RESUME_STRUCTURE_SYSTEM = `你是简历结构化助手。把用户的纯文本简历整理成结构化 JSON——只重组结构,保持原文信息,绝不编造、不夸大、不删减实质内容。

解析成:
- name: 姓名
- headline: 一句话定位/头衔(简历里有就用;没有就根据内容凝练一句,如"AI 产品经理 · 半年独立项目转型")
- contacts: 联系方式与基本信息条目(城市/电话/邮箱/GitHub 等),每条一个字符串
- sections: 各板块。每块 { title: 板块名(个人总结/教育背景/工作经历/项目经历/技能 等), entries: [...] }
  - entry: { heading: 条目标题(公司/学校/项目名;纯叙述段落留空), meta: 时间/角色等附注(没有留空), bullets: 要点数组(每条一句;原文是段落就拆成要点,或整段作为一条) }

要求:
- 中文;保持原文事实,不编造经历或数字。
- "个人总结"这类没有明确条目的,作为一个 section,entries 给一条,heading 与 meta 留空,bullets 放内容。
- 只输出合法 JSON object,不要 markdown、不要代码块、不要前后缀。

结构:
{ "name": "", "headline": "", "contacts": [""], "sections": [{ "title": "", "entries": [{ "heading": "", "meta": "", "bullets": [""] }] }] }`;

export function buildStructureUserPrompt(resumeText: string): string {
  return `把下面这份简历整理成结构化 JSON:\n\n${resumeText}`;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
function isEntry(v: unknown): v is ResumeEntry {
  return isObject(v) && typeof v.heading === "string" && typeof v.meta === "string" && isStringArray(v.bullets);
}
function isSection(v: unknown): v is ResumeSection {
  return isObject(v) && typeof v.title === "string" && Array.isArray(v.entries) && v.entries.every(isEntry);
}

export function validateStructuredResume(v: unknown): Result<StructuredResume> {
  if (!isObject(v)) return { ok: false, error: "顶层不是 JSON object" };
  if (typeof v.name !== "string") return { ok: false, error: "name 缺失" };
  if (typeof v.headline !== "string") return { ok: false, error: "headline 缺失" };
  if (!isStringArray(v.contacts)) return { ok: false, error: "contacts 结构不正确" };
  if (!Array.isArray(v.sections) || !v.sections.every(isSection)) return { ok: false, error: "sections 结构不正确" };
  return { ok: true, data: v as StructuredResume };
}

// 空白结构（用户从零手填时的初值）。
export function emptyResume(name = ""): StructuredResume {
  return { name, headline: "", contacts: [], sections: [] };
}
