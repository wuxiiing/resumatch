import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";
import type {
  AnalysisReport,
  RequirementCheck,
  ResumeAnnotation
} from "@/types/analysis";

const NO_CONTENT = "暂无";
export const WORD_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type KeywordSummary = {
  covered: string[];
  missing: string[];
  weak: string[];
};

export async function generateAnalysisReportDocx(
  report: AnalysisReport
): Promise<Buffer> {
  const keywordSummary = getKeywordSummary(report);
  const resumeText = getCleanResumeText(report);
  const improveAnnotations = getImproveAnnotations(report);

  const document = new Document({
    creator: "ResuMatch",
    description: "ResuMatch 简历匹配分析报告",
    sections: [
      {
        children: [
          title("ResuMatch 简历匹配分析报告"),
          body(`匹配度分数：${formatScore(report.score)}`),
          sectionTitle("分析摘要"),
          body(normalizeText(report.summary) || NO_CONTENT),
          sectionTitle("岗位方向"),
          ...list(
            report.jobDirection.map((item) =>
              [item.label, item.description].filter(Boolean).join("：")
            )
          ),
          sectionTitle("JD 覆盖摘要"),
          body(`已覆盖：${formatInlineList(keywordSummary.covered)}`),
          body(`待优化：${formatInlineList(keywordSummary.weak)}`),
          body(`补充建议：${formatInlineList(keywordSummary.missing)}`),
          sectionTitle("简历原文干净版"),
          ...plainTextBlock(resumeText || NO_CONTENT),
          sectionTitle("优化建议清单"),
          ...formatImproveAnnotations(improveAnnotations)
        ]
      }
    ],
    title: "ResuMatch 简历匹配分析报告"
  });

  return Packer.toBuffer(document);
}

export function getExportWordFilename(): string {
  return "ResuMatch-分析报告.docx";
}

export function getExportWordHeaders(): Record<string, string> {
  return {
    "Content-Disposition": buildContentDisposition(getExportWordFilename()),
    "Content-Type": WORD_CONTENT_TYPE
  };
}

function title(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.TITLE,
    spacing: { after: 240 },
    children: [new TextRun({ bold: true, text })]
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 120, before: 300 },
    children: [new TextRun({ bold: true, text })]
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text })]
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text })]
  });
}

function list(items: string[]): Paragraph[] {
  const meaningfulItems = uniqueMeaningful(items);

  if (meaningfulItems.length === 0) {
    return [body(NO_CONTENT)];
  }

  return meaningfulItems.map((item) => bullet(item));
}

function formatImproveAnnotations(annotations: ResumeAnnotation[]): Paragraph[] {
  if (annotations.length === 0) {
    return [body("暂无明确优化建议。")];
  }

  return annotations.flatMap((annotation, index) => [
    body(`${index + 1}. 原文片段：${normalizeText(annotation.original) || NO_CONTENT}`),
    body(`JD 关联：${normalizeText(annotation.relatedJdNeed) || NO_CONTENT}`),
    body(`问题原因：${normalizeText(annotation.reason) || NO_CONTENT}`),
    body(`建议：${normalizeText(annotation.suggestion) || NO_CONTENT}`),
    body(`参考改写：${normalizeText(annotation.rewriteExample) || NO_CONTENT}`)
  ]);
}

function plainTextBlock(text: string): Paragraph[] {
  return normalizeText(text)
    .split("\n")
    .map((line) => body(line.trim() || " "));
}

function getImproveAnnotations(report: AnalysisReport): ResumeAnnotation[] {
  return (report.annotations ?? []).filter(
    (annotation) =>
      annotation.status === "improve" &&
      isMeaningfulText(annotation.original) &&
      (isMeaningfulText(annotation.suggestion) ||
        isMeaningfulText(annotation.reason) ||
        isMeaningfulText(annotation.rewriteExample))
  );
}

function getCleanResumeText(report: AnalysisReport): string {
  return normalizeText(report.resumeDisplayText || report.resumeOriginal || "");
}

function getKeywordSummary(report: AnalysisReport): KeywordSummary {
  const requirementChecks = report.requirementChecks ?? [];

  return {
    covered: uniqueMeaningful([
      ...report.matchedKeywords,
      ...getRequirementLabels(requirementChecks, "present")
    ]),
    missing: uniqueMeaningful([
      ...getRequirementLabels(requirementChecks, "missing"),
      ...report.missingKeywords
    ]),
    weak: uniqueMeaningful(getRequirementLabels(requirementChecks, "weak"))
  };
}

function getRequirementLabels(
  checks: RequirementCheck[],
  status: RequirementCheck["status"]
): string[] {
  return checks
    .filter((check) => check.status === status)
    .map((check) => {
      const note = normalizeText(check.note);
      return note ? `${check.label}（${note}）` : check.label;
    });
}

function formatInlineList(items: string[]): string {
  return items.length > 0 ? items.join("、") : NO_CONTENT;
}

function formatScore(score: number): string {
  return Number.isFinite(score) ? `${Math.round(score)}%` : NO_CONTENT;
}

function buildContentDisposition(filename: string): string {
  const fallback = "ResuMatch-report.docx";
  const encodedFilename = encodeURIComponent(filename);

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodedFilename}`;
}

function uniqueMeaningful(items: string[]): string[] {
  const seen = new Set<string>();

  return items
    .map(normalizeText)
    .filter(isMeaningfulText)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function isMeaningfulText(value: string | undefined): value is string {
  const normalized = normalizeText(value).toLowerCase();

  return Boolean(
    normalized &&
      !["无", "无需", "不需要修改", "n/a", "-", "na"].includes(normalized)
  );
}
