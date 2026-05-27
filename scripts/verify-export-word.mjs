import assert from "node:assert/strict";
import JSZip from "jszip";
import {
  generateAnalysisReportDocx,
  getExportWordHeaders,
  WORD_CONTENT_TYPE
} from "../lib/export-word.ts";

const fakeReport = {
  score: 82,
  summary: "候选人与前端产品工程岗位匹配度较高，但需要补强业务结果表达。",
  resumeDisplayText: "张三\n前端工程师\n负责 ResuMatch 报告页导出体验。",
  resumeOriginal: "这段原文不应优先出现。",
  jobDirection: [
    {
      label: "前端产品工程师",
      description: "适合负责复杂表单、报告页和 AI 产品前端体验。"
    }
  ],
  matchedKeywords: ["React", "Next.js"],
  missingKeywords: ["A/B 实验"],
  requirementChecks: [
    {
      label: "复杂前端工程经验",
      priority: "must",
      status: "present",
      evidence: "报告页和导出流程",
      note: "已有相关项目证据"
    },
    {
      label: "业务指标表达",
      priority: "preferred",
      status: "weak",
      evidence: "缺少指标",
      note: "需要量化结果"
    },
    {
      label: "A/B 实验",
      priority: "context",
      status: "missing",
      evidence: "",
      note: "补充增长实验经验会更完整"
    }
  ],
  suggestions: [],
  history: [],
  annotations: [
    {
      id: "a1",
      original: "负责 ResuMatch 报告页导出体验",
      status: "improve",
      relatedJdNeed: "复杂前端工程经验",
      reason: "说明了职责，但缺少结果和规模。",
      suggestion: "补充用户场景、交付结果和可验证指标。",
      rewriteExample:
        "负责 ResuMatch 报告页导出体验，打通前端交互与 Word 文件生成链路，提升报告交付完整度。"
    }
  ],
  segments: []
};

const buffer = await generateAnalysisReportDocx(fakeReport);
assert(buffer.length > 0, "docx buffer should be non-empty");

const zip = await JSZip.loadAsync(buffer);
const documentXml = await zip.file("word/document.xml")?.async("string");
assert(documentXml, "word/document.xml should exist");

for (const expectedText of [
  "82%",
  fakeReport.summary,
  "张三",
  "前端工程师",
  "负责 ResuMatch 报告页导出体验。",
  fakeReport.annotations[0].suggestion
]) {
  assert(
    documentXml.includes(expectedText),
    `document should contain: ${expectedText}`
  );
}

assert(
  !documentXml.includes(fakeReport.resumeOriginal),
  "resumeDisplayText should be preferred over resumeOriginal"
);

const headers = getExportWordHeaders();
assert.equal(headers["Content-Type"], WORD_CONTENT_TYPE);
assert.match(headers["Content-Disposition"], /^attachment;/);
assert.match(headers["Content-Disposition"], /filename="ResuMatch-report\.docx"/);
assert.match(headers["Content-Disposition"], /filename\*=UTF-8''/);

console.log("EXPORT-0001 verification passed");
