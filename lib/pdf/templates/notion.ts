// Notion 风：Sans 通体、暖灰墨色（#37352f）、浅灰细分隔线（#e9e9e7）、行距舒展。文档感、朴素。
import React from "react";
import { Document, StyleSheet } from "@react-pdf/renderer";
import type { StructuredResume } from "../../resume-structured.ts";
import { registerResumeFonts, FONT_SANS } from "../fonts.ts";
import { ResumePage, type ResumeTheme } from "./ats-classic.ts";

const notionTheme: ResumeTheme = StyleSheet.create({
  page: { paddingVertical: 44, paddingHorizontal: 46, fontFamily: FONT_SANS, fontSize: 10.5, color: "#37352f" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, paddingRight: 16 },
  photo: { width: 72, height: 100, objectFit: "cover", borderRadius: 3, borderWidth: 1, borderColor: "#e9e9e7" },
  name: { fontSize: 21, fontWeight: "bold", fontFamily: FONT_SANS, color: "#37352f" },
  headlineRow: { marginTop: 4 },
  headline: { fontSize: 11, color: "#787774", lineHeight: 1.5 },
  contacts: { fontSize: 9, color: "#9b9a97", marginTop: 6 },
  section: { marginTop: 16 },
  sectionTitleWrap: { borderBottomWidth: 1, borderBottomColor: "#e9e9e7", paddingBottom: 4, marginBottom: 7 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", fontFamily: FONT_SANS, color: "#37352f" },
  entry: { marginBottom: 9 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2 },
  heading: { fontSize: 11, fontWeight: "bold", color: "#37352f" },
  meta: { fontSize: 9, color: "#9b9a97" },
  bullet: { flexDirection: "row", marginTop: 2 },
  dot: { width: 11, fontSize: 10.5, color: "#9b9a97" },
  bulletText: { fontSize: 10.5, lineHeight: 1.65 },
  para: { fontSize: 10.5, lineHeight: 1.65, marginTop: 2 },
});

/** Notion 风简历。 */
export function NotionDocument(resume: StructuredResume): React.ReactElement {
  registerResumeFonts();
  return React.createElement(Document, null, ResumePage(resume, notionTheme));
}
