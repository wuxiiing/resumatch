import type {
  AnalysisReport,
  HistoryItem,
  JobDirectionItem,
  ReportSegment,
  SegmentStatus,
  SuggestionSummary
} from "@/types/analysis";

export type AnalyzeRequest = {
  resumeText: string;
  jobDescription: string;
};

type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

const MAX_RESUME_TEXT_LENGTH = 3000;
const MAX_JOB_DESCRIPTION_LENGTH = 1000;
const segmentStatuses = new Set<SegmentStatus>(["relevant", "optimize", "irrelevant"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCharCount(value: string): number {
  return Array.from(value).length;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isJobDirectionItem(value: unknown): value is JobDirectionItem {
  return (
    isPlainObject(value) &&
    typeof value.label === "string" &&
    typeof value.description === "string"
  );
}

function isSuggestionSummary(value: unknown): value is SuggestionSummary {
  return (
    isPlainObject(value) &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    typeof value.count === "number"
  );
}

function isHistoryItem(value: unknown): value is HistoryItem {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.company === "string" &&
    typeof value.role === "string" &&
    typeof value.time === "string" &&
    typeof value.score === "number" &&
    (value.active === undefined || typeof value.active === "boolean")
  );
}

function isReportSegment(value: unknown): value is ReportSegment {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.section === "string" &&
    typeof value.original === "string" &&
    typeof value.status === "string" &&
    segmentStatuses.has(value.status as SegmentStatus) &&
    typeof value.comment === "string" &&
    typeof value.suggestion === "string"
  );
}

export function validateAnalyzeRequest(payload: unknown): ValidationResult<AnalyzeRequest> {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "请求体必须是 JSON 对象。" };
  }

  if (typeof payload.resumeText !== "string" || payload.resumeText.trim().length === 0) {
    return { ok: false, error: "简历文本不能为空。" };
  }

  if (getCharCount(payload.resumeText) > MAX_RESUME_TEXT_LENGTH) {
    return { ok: false, error: "简历文本不能超过 3000 字。" };
  }

  if (
    typeof payload.jobDescription !== "string" ||
    payload.jobDescription.trim().length === 0
  ) {
    return { ok: false, error: "岗位 JD 不能为空。" };
  }

  if (getCharCount(payload.jobDescription) > MAX_JOB_DESCRIPTION_LENGTH) {
    return { ok: false, error: "岗位 JD 不能超过 1000 字。" };
  }

  return {
    ok: true,
    data: {
      resumeText: payload.resumeText.trim(),
      jobDescription: payload.jobDescription.trim()
    }
  };
}

export function validateAnalysisReport(report: unknown): ValidationResult<AnalysisReport> {
  if (!isPlainObject(report)) {
    return { ok: false, error: "分析结果必须是 JSON 对象。" };
  }

  if (typeof report.score !== "number" || report.score < 0 || report.score > 100) {
    return { ok: false, error: "分析结果 score 必须是 0 到 100 的数字。" };
  }

  if (typeof report.summary !== "string") {
    return { ok: false, error: "分析结果 summary 必须是字符串。" };
  }

  if (!Array.isArray(report.jobDirection) || !report.jobDirection.every(isJobDirectionItem)) {
    return { ok: false, error: "分析结果 jobDirection 结构不正确。" };
  }

  if (!isStringArray(report.matchedKeywords)) {
    return { ok: false, error: "分析结果 matchedKeywords 结构不正确。" };
  }

  if (!isStringArray(report.missingKeywords)) {
    return { ok: false, error: "分析结果 missingKeywords 结构不正确。" };
  }

  if (!Array.isArray(report.suggestions) || !report.suggestions.every(isSuggestionSummary)) {
    return { ok: false, error: "分析结果 suggestions 结构不正确。" };
  }

  if (!Array.isArray(report.history) || !report.history.every(isHistoryItem)) {
    return { ok: false, error: "分析结果 history 结构不正确。" };
  }

  if (!Array.isArray(report.segments) || !report.segments.every(isReportSegment)) {
    return { ok: false, error: "分析结果 segments 结构不正确。" };
  }

  return { ok: true, data: report as AnalysisReport };
}
