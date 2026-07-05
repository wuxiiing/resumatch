// ai-pro —— 独家「研判版」简历。第 1 页 = 标准简历（复用 ats-classic 正文页），
// 第 2 页 = 岗位匹配研判摘要（研判结论 / 研判理由 / 逐条对照 / 他们想要的人），数据取自 AgentReport。
// 定位：给作者本人 / 作品集看的分析版，不是投递版（投递用 ats-classic）。故末尾带「勿投递」免责说明。
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { StructuredResume } from "../../resume-structured.ts";
import { type AgentReport, type MatchGap, statusKind } from "../../agent-report.ts";
import { registerResumeFonts, FONT_SANS, FONT_SERIF } from "../fonts.ts";
import { CJKText } from "../cjk-text.ts";
import { ResumePage, classicTheme } from "./ats-classic.ts";

const c = React.createElement;

const STATUS_COLOR: Record<"hit" | "partial" | "miss", string> = {
  hit: "#2f7d32",
  partial: "#b7791f",
  miss: "#9a9a9a",
};

const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontFamily: FONT_SERIF, fontSize: 10.5, color: "#1a1a1a" },
  kicker: { fontSize: 9, letterSpacing: 1, color: "#8a8a8a", marginBottom: 3, fontFamily: FONT_SANS },
  title: { fontSize: 18, fontWeight: "bold", fontFamily: FONT_SANS, color: "#111111" },
  metaLine: { fontSize: 9.5, color: "#666666", marginTop: 4 },
  verdictRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  verdictLabel: { fontSize: 10, color: "#666666", marginRight: 8 },
  verdictPill: { fontSize: 12, fontWeight: "bold", fontFamily: FONT_SANS, color: "#ffffff", backgroundColor: "#3a5a40", paddingVertical: 3, paddingHorizontal: 11, borderRadius: 3 },
  sectionTitleWrap: { borderBottomWidth: 1, borderBottomColor: "#333333", paddingBottom: 3, marginTop: 16, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", fontFamily: FONT_SANS, color: "#222222" },
  body: { fontSize: 10.5, lineHeight: 1.6 },
  tradeoff: { fontSize: 9.5, color: "#666666", lineHeight: 1.55 },
  gap: { marginBottom: 7 },
  gapHead: { flexDirection: "row", alignItems: "center", marginBottom: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  gapNeed: { fontSize: 10.5, fontWeight: "bold", color: "#222222" },
  gapStatus: { fontSize: 8.5, fontWeight: "bold", marginLeft: 6 },
  gapNote: { fontSize: 9.5, color: "#555555", lineHeight: 1.5 },
  disclaimer: { fontSize: 8.5, color: "#9a9a9a", lineHeight: 1.5 },
});

function SectionTitle(text: string): React.ReactElement {
  return c(View, { style: s.sectionTitleWrap }, c(Text, { style: s.sectionTitle }, text));
}

function Gap(gap: MatchGap, key: number): React.ReactElement {
  const color = STATUS_COLOR[statusKind(gap.status || "")];
  return c(
    View,
    { key, style: s.gap },
    c(
      View,
      { style: s.gapHead },
      c(View, { style: [s.dot, { backgroundColor: color }] }),
      CJKText(gap.need, s.gapNeed, { flex: 1 }),
      gap.status ? c(Text, { style: [s.gapStatus, { color }] }, gap.status) : null,
    ),
    gap.note ? CJKText(gap.note, s.gapNote, { marginLeft: 12 }) : null,
  );
}

function MatchSummaryPage(report: AgentReport): React.ReactElement {
  const mj = report.matchJudgment;
  const metaLine = [report.meta.company, report.meta.position].filter(Boolean).join(" · ");
  const gaps = Array.isArray(mj.gaps) ? mj.gaps : [];
  return c(
    Page,
    { size: "A4", style: s.page },
    c(
      View,
      null,
      c(Text, { style: s.kicker }, "AI 岗位匹配研判"),
      c(Text, { style: s.title }, "岗位匹配研判"),
      metaLine ? c(Text, { style: s.metaLine }, report.meta.date ? `${metaLine}　·　${report.meta.date}` : metaLine) : null,
    ),
    mj.tier ? c(View, { style: s.verdictRow }, c(Text, { style: s.verdictLabel }, "研判结论"), c(Text, { style: s.verdictPill }, mj.tier)) : null,
    mj.reasoning
      ? c(View, null, SectionTitle("研判理由"), CJKText(mj.reasoning, s.body), mj.tradeoff ? CJKText(`取舍：${mj.tradeoff}`, s.tradeoff, { marginTop: 4 }) : null)
      : null,
    gaps.length ? c(View, null, SectionTitle("逐条对照"), ...gaps.map((g, i) => Gap(g, i))) : null,
    report.jdAnalysis.whoTheyWant ? c(View, null, SectionTitle("他们想要的人"), CJKText(report.jdAnalysis.whoTheyWant, s.body)) : null,
    CJKText("本页为 AI 基于岗位 JD 与你的简历生成的研判摘要，含推断成分，仅供你自己判断参考，不建议随简历投递给招聘方。", s.disclaimer, { marginTop: 22 }),
  );
}

/** 研判版：第 1 页标准简历 + 第 2 页匹配研判。需要 resume 与最近一次 AgentReport。 */
export function AiProDocument(resume: StructuredResume, report: AgentReport): React.ReactElement {
  registerResumeFonts();
  return c(Document, null, ResumePage(resume, classicTheme), MatchSummaryPage(report));
}
