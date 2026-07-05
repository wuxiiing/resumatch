// 纯函数：JSON Resume v1(公开标准) ↔ StructuredResume(本项目内部结构)双向映射。
// StructuredResume 是「姓名 + 定位 + 联系方式 + 自由分块」的松散结构(LLM 解析产物,不分板块类型);
// JSON Resume 是强类型标准(work / education / skills / projects 各自独立数组)。
// 两者形状不同,映射必然有损/启发式:能对应的字段按下面规则尽量保留信息且可逆,
// 对不上的(无法归类的 section 标题、无法识别的联系方式片段)直接忽略,忽略处均有注释说明。

import type { ResumeEntry, ResumeSection, StructuredResume } from "./resume-structured.ts";

// ---- JSON Resume v1 最小类型:只声明本文件实际映射到的字段 ----
export type JsonResumeBasics = {
  name?: string;
  label?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: { address?: string };
};
export type JsonResumeWork = { name?: string; position?: string; highlights?: string[] };
export type JsonResumeEducation = { institution?: string; area?: string; courses?: string[] };
export type JsonResumeSkill = { name?: string; keywords?: string[] };
export type JsonResumeProject = { name?: string; description?: string; highlights?: string[] };
export type JsonResume = {
  basics: JsonResumeBasics;
  work?: JsonResumeWork[];
  education?: JsonResumeEducation[];
  skills?: JsonResumeSkill[];
  projects?: JsonResumeProject[];
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
// 宽松匹配一串连续数字(允许中间夹空格/短横线),够用即可,不做国际号码格式的完整解析。
const PHONE_RE = /\+?\d[\d\- ]{6,}\d/;
// contacts 中无法识别成 email/phone 的片段,拼接进 location.address 时的分隔符;
// 往返转换按同一分隔符切回数组,只要原始文本不包含它就是可逆的。
const CONTACT_JOINER = " · ";

type SectionKind = "work" | "education" | "skills" | "projects" | "summary" | "other";

function classifySectionTitle(title: string): SectionKind {
  if (/教育|学历/.test(title)) return "education";
  if (/工作|职业|履历/.test(title)) return "work";
  if (/项目/.test(title)) return "projects";
  if (/技能|能力/.test(title)) return "skills";
  if (/总结|自我评价|简介/.test(title)) return "summary";
  return "other";
}

export function toJsonResume(s: StructuredResume): JsonResume {
  const basics: JsonResumeBasics = { name: s.name, label: s.headline };

  // contacts 是不分类型的展示字符串数组;email/phone 用正则尽量识别出来,
  // 其余(城市、GitHub 链接等自由文本)整体拼接进 location.address,避免丢信息。
  const rest: string[] = [];
  for (const line of s.contacts) {
    const email = line.match(EMAIL_RE)?.[0];
    const phone = line.match(PHONE_RE)?.[0];
    if (email && !basics.email) basics.email = email;
    else if (phone && !basics.phone) basics.phone = phone;
    else rest.push(line);
  }
  if (rest.length > 0) basics.location = { address: rest.join(CONTACT_JOINER) };

  const work: JsonResumeWork[] = [];
  const education: JsonResumeEducation[] = [];
  const skills: JsonResumeSkill[] = [];
  const projects: JsonResumeProject[] = [];

  for (const section of s.sections) {
    const kind = classifySectionTitle(section.title);

    if (kind === "summary") {
      // 约定(与 resume-structured.ts 的解析 prompt 一致):"个人总结"类板块只有一条 entry,
      // heading/meta 留空、bullets 放内容;多条 bullets 换行拼接成一段 summary 文本。
      const text = section.entries.flatMap((e) => e.bullets).join("\n");
      if (text) basics.summary = basics.summary ? `${basics.summary}\n${text}` : text;
      continue;
    }

    for (const entry of section.entries) {
      if (kind === "work") {
        work.push({ name: entry.heading, position: entry.meta, highlights: entry.bullets });
      } else if (kind === "education") {
        education.push({ institution: entry.heading, area: entry.meta, courses: entry.bullets });
      } else if (kind === "skills") {
        skills.push({ name: entry.heading, keywords: entry.bullets });
      } else if (kind === "projects") {
        projects.push({ name: entry.heading, description: entry.meta, highlights: entry.bullets });
      }
      // kind === "other": 无法归类的板块(如"荣誉奖项"等自定义标题),JSON Resume 标准里没有对应位置,直接忽略。
    }
  }

  const result: JsonResume = { basics };
  if (work.length) result.work = work;
  if (education.length) result.education = education;
  if (skills.length) result.skills = skills;
  if (projects.length) result.projects = projects;
  return result;
}

export function fromJsonResume(j: JsonResume): StructuredResume {
  const contacts: string[] = [];
  if (j.basics.phone) contacts.push(j.basics.phone);
  if (j.basics.email) contacts.push(j.basics.email);
  if (j.basics.location?.address) contacts.push(...j.basics.location.address.split(CONTACT_JOINER));

  const sections: ResumeSection[] = [];

  if (j.basics.summary) {
    sections.push({ title: "个人总结", entries: [{ heading: "", meta: "", bullets: [j.basics.summary] }] });
  }
  if (j.work?.length) {
    sections.push({
      title: "工作经历",
      entries: j.work.map(
        (w): ResumeEntry => ({ heading: w.name ?? "", meta: w.position ?? "", bullets: w.highlights ?? [] }),
      ),
    });
  }
  if (j.education?.length) {
    sections.push({
      title: "教育背景",
      entries: j.education.map(
        (e): ResumeEntry => ({ heading: e.institution ?? "", meta: e.area ?? "", bullets: e.courses ?? [] }),
      ),
    });
  }
  if (j.projects?.length) {
    sections.push({
      title: "项目经历",
      entries: j.projects.map(
        (p): ResumeEntry => ({ heading: p.name ?? "", meta: p.description ?? "", bullets: p.highlights ?? [] }),
      ),
    });
  }
  if (j.skills?.length) {
    sections.push({
      title: "技能",
      entries: j.skills.map((sk): ResumeEntry => ({ heading: sk.name ?? "", meta: "", bullets: sk.keywords ?? [] })),
    });
  }

  return { name: j.basics.name ?? "", headline: j.basics.label ?? "", contacts, sections };
}
