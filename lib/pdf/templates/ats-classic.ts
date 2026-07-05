// 简历模板引擎 + ats-classic 主题。
// 渲染结构（Header + sections + entries + bullets）与 CJK 断行方案在这里共享；
// 不同风格（classic / apple / notion …）只是传入不同的 ResumeTheme（一套具名样式），结构不变。
// 服务端渲染：调用方 renderToBuffer(AtsClassicDocument(resume)) 出 PDF。
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { StructuredResume, ResumeSection, ResumeEntry } from "../../resume-structured.ts";
import { registerResumeFonts, FONT_SANS, FONT_SERIF } from "../fonts.ts";
import { CJKText } from "../cjk-text.ts";

const c = React.createElement;

// react-pdf 未导出单条样式类型，从组件 style prop 反推（排除数组形式）。
type Style = Exclude<NonNullable<React.ComponentProps<typeof View>["style"]>, unknown[]>;

// 引擎用到的具名样式集合。换风格 = 换一套齐全的 ResumeTheme。
export type ResumeTheme = Record<
  | "page" | "headerRow" | "headerLeft" | "photo" | "name" | "headlineRow" | "headline" | "contacts"
  | "section" | "sectionTitleWrap" | "sectionTitle" | "entry" | "entryHead" | "heading" | "meta"
  | "bullet" | "dot" | "bulletText" | "para",
  Style
>;

function Bullet(text: string, key: number, t: ResumeTheme): React.ReactElement {
  return c(View, { key, style: t.bullet }, c(Text, { style: t.dot }, "·"), CJKText(text, t.bulletText, { flex: 1 }));
}

function Entry(entry: ResumeEntry, key: number, t: ResumeTheme): React.ReactElement {
  const hasHead = Boolean(entry.heading || entry.meta);
  return c(
    View,
    { key, style: t.entry, wrap: false },
    hasHead
      ? c(View, { style: t.entryHead }, c(Text, { style: t.heading }, entry.heading), entry.meta ? c(Text, { style: t.meta }, entry.meta) : null)
      : null,
    // 有条目头 → 要点带项目符号；无头（个人总结/技能这类）→ 直接当段落渲染
    ...entry.bullets.map((b, i) => (hasHead ? Bullet(b, i, t) : CJKText(b, t.para))),
  );
}

function Section(section: ResumeSection, key: number, t: ResumeTheme): React.ReactElement {
  return c(
    View,
    { key, style: t.section },
    c(View, { style: t.sectionTitleWrap }, c(Text, { style: t.sectionTitle }, section.title)),
    ...section.entries.map((e, i) => Entry(e, i, t)),
  );
}

// 页眉：有证件照 → 左文右照（国内简历）；无照片 → 保持整宽（ATS 纯净）。
function Header(resume: StructuredResume, t: ResumeTheme): React.ReactElement {
  const info = c(
    View,
    resume.photo ? { style: t.headerLeft } : null,
    c(Text, { style: t.name }, resume.name),
    resume.headline ? CJKText(resume.headline, t.headline, t.headlineRow) : null,
    resume.contacts.length ? c(Text, { style: t.contacts }, resume.contacts.join("   ·   ")) : null,
  );
  if (!resume.photo) return info;
  return c(View, { style: t.headerRow }, info, c(Image, { style: t.photo, src: resume.photo }));
}

/** 简历正文页（Header + 各 section），按传入主题渲染。多页模板（如 ai-pro）复用它作第 1 页。 */
export function ResumePage(resume: StructuredResume, t: ResumeTheme): React.ReactElement {
  return c(Page, { size: "A4", style: t.page }, Header(resume, t), ...resume.sections.map((sec, i) => Section(sec, i, t)));
}

// ats-classic：宋体正文 + 墨色分隔线，克制、ATS 友好。
export const classicTheme: ResumeTheme = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontFamily: FONT_SERIF, fontSize: 10.5, color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, paddingRight: 16 },
  photo: { width: 72, height: 100, objectFit: "cover", borderWidth: 1, borderColor: "#dddddd" },
  name: { fontSize: 22, fontWeight: "bold", fontFamily: FONT_SANS, color: "#111111" },
  headlineRow: { marginTop: 4 },
  headline: { fontSize: 11.5, color: "#444444", lineHeight: 1.5 },
  contacts: { fontSize: 9, color: "#666666", marginTop: 6 },
  section: { marginTop: 14 },
  sectionTitleWrap: { borderBottomWidth: 1, borderBottomColor: "#333333", paddingBottom: 3, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", fontFamily: FONT_SANS, color: "#222222" },
  entry: { marginBottom: 8 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2 },
  heading: { fontSize: 11, fontWeight: "bold", color: "#222222" },
  meta: { fontSize: 9, color: "#666666" },
  bullet: { flexDirection: "row", marginTop: 1.5 },
  dot: { width: 11, fontSize: 10.5, color: "#555555" },
  bulletText: { fontSize: 10.5, lineHeight: 1.55 },
  para: { fontSize: 10.5, lineHeight: 1.6, marginTop: 1.5 },
});

/** 把结构化简历渲成 react-pdf 的 <Document>（ats-classic 主题）。 */
export function AtsClassicDocument(resume: StructuredResume): React.ReactElement {
  registerResumeFonts(); // 幂等；首次渲染时注册字体
  return c(Document, null, ResumePage(resume, classicTheme));
}
