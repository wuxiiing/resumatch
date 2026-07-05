// 苹果风：Sans 通体、留白舒展、无分隔线（靠字重 + 空白分层）、冷灰阶、圆角照片。极简克制。
import React from "react";
import { Document, StyleSheet } from "@react-pdf/renderer";
import type { StructuredResume } from "../../resume-structured.ts";
import { registerResumeFonts, FONT_SANS } from "../fonts.ts";
import { ResumePage, type ResumeTheme } from "./ats-classic.ts";

const appleTheme: ResumeTheme = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 52, fontFamily: FONT_SANS, fontSize: 10, color: "#1d1d1f" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, paddingRight: 18 },
  photo: { width: 70, height: 98, objectFit: "cover", borderRadius: 4 },
  name: { fontSize: 25, fontWeight: "bold", fontFamily: FONT_SANS, color: "#1d1d1f", letterSpacing: 0.3 },
  headlineRow: { marginTop: 5 },
  headline: { fontSize: 11, color: "#6e6e73", lineHeight: 1.5 },
  contacts: { fontSize: 8.5, color: "#86868b", marginTop: 7, letterSpacing: 0.2 },
  section: { marginTop: 20 },
  sectionTitleWrap: { marginBottom: 7 }, // 无分隔线，靠留白
  sectionTitle: { fontSize: 10.5, fontWeight: "bold", fontFamily: FONT_SANS, color: "#1d1d1f", letterSpacing: 0.6 },
  entry: { marginBottom: 12 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 3 },
  heading: { fontSize: 10.5, fontWeight: "bold", color: "#1d1d1f" },
  meta: { fontSize: 8.5, color: "#86868b" },
  bullet: { flexDirection: "row", marginTop: 2.5 },
  dot: { width: 11, fontSize: 10, color: "#a1a1a6" },
  bulletText: { fontSize: 10, lineHeight: 1.7 },
  para: { fontSize: 10, lineHeight: 1.7, marginTop: 2.5 },
});

/** 苹果风简历。 */
export function AppleDocument(resume: StructuredResume): React.ReactElement {
  registerResumeFonts();
  return React.createElement(Document, null, ResumePage(resume, appleTheme));
}
