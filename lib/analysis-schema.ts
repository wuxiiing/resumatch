import type {
  AnalysisReport,
  AnnotationStatus,
  HistoryItem,
  JobDirectionItem,
  ReportSegment,
  RequirementCheck,
  RequirementCheckPriority,
  RequirementCheckStatus,
  ResumeAnnotation,
  ResumeFileType,
  RubricRating,
  RubricRatingLevel,
  RubricRatings,
  SegmentStatus,
  SuggestionSummary
} from "@/types/analysis";

export type AnalyzeRequest = {
  resumeText: string;
  jobDescription: string;
  resumeFileType?: ResumeFileType;
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
const annotationStatuses = new Set<AnnotationStatus>(["keep", "improve", "remove"]);
const rubricRatingLevels = new Set<RubricRatingLevel>([
  "strong",
  "medium",
  "weak",
  "missing"
]);
const requirementCheckPriorities = new Set<RequirementCheckPriority>([
  "must",
  "preferred",
  "context"
]);
const requirementCheckStatuses = new Set<RequirementCheckStatus>([
  "present",
  "weak",
  "missing"
]);
const segmentStatuses = new Set<SegmentStatus>(["relevant", "optimize", "irrelevant"]);
const resumeFileTypes = new Set<ResumeFileType>(["docx", "xlsx", "pdf", "txt"]);
const rubricRatingKeys = [
  "hardSkillMatch",
  "evidenceStrength",
  "businessContext",
  "quantifiedResult",
  "resumeClarity"
] as const;

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

function isRubricRating(value: unknown): value is RubricRating {
  return (
    isPlainObject(value) &&
    typeof value.level === "string" &&
    rubricRatingLevels.has(value.level as RubricRatingLevel) &&
    typeof value.evidence === "string" &&
    typeof value.gap === "string"
  );
}

export function validateRubricRatings(value: unknown): ValidationResult<RubricRatings> {
  if (!isPlainObject(value)) {
    return { ok: false, error: "rubricRatings must be an object." };
  }

  for (const key of rubricRatingKeys) {
    if (!isRubricRating(value[key])) {
      return { ok: false, error: `rubricRatings.${key} is missing or invalid.` };
    }
  }

  return { ok: true, data: value as RubricRatings };
}

function isRequirementCheck(value: unknown): value is RequirementCheck {
  const requirementCheckKeys = ["label", "priority", "status", "evidence", "note"];

  return (
    isPlainObject(value) &&
    Object.keys(value).every((key) => requirementCheckKeys.includes(key)) &&
    typeof value.label === "string" &&
    typeof value.priority === "string" &&
    requirementCheckPriorities.has(value.priority as RequirementCheckPriority) &&
    typeof value.status === "string" &&
    requirementCheckStatuses.has(value.status as RequirementCheckStatus) &&
    typeof value.evidence === "string" &&
    typeof value.note === "string"
  );
}

export function validateRequirementChecks(value: unknown): ValidationResult<RequirementCheck[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: "requirementChecks must be an array." };
  }

  if (!value.every(isRequirementCheck)) {
    return { ok: false, error: "requirementChecks contains invalid items." };
  }

  return { ok: true, data: value };
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

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function isResumeAnnotation(value: unknown): value is ResumeAnnotation {
  if (
    !isPlainObject(value) ||
    typeof value.id !== "string" ||
    typeof value.original !== "string" ||
    typeof value.status !== "string" ||
    !annotationStatuses.has(value.status as AnnotationStatus) ||
    typeof value.relatedJdNeed !== "string" ||
    typeof value.reason !== "string" ||
    typeof value.suggestion !== "string" ||
    (value.rewriteExample !== undefined && typeof value.rewriteExample !== "string") ||
    (value.section !== undefined && typeof value.section !== "string") ||
    !isOptionalNumber(value.startIndex) ||
    !isOptionalNumber(value.endIndex)
  ) {
    return false;
  }

  if (value.status === "improve") {
    if (typeof value.rewriteExample !== "string" || value.rewriteExample.trim().length === 0) {
      return false;
    }
  }

  return true;
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
      jobDescription: payload.jobDescription.trim(),
      resumeFileType:
        typeof payload.resumeFileType === "string" &&
        resumeFileTypes.has(payload.resumeFileType as ResumeFileType)
          ? (payload.resumeFileType as ResumeFileType)
          : undefined
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

  if (report.rubricRatings !== undefined) {
    const rubricValidation = validateRubricRatings(report.rubricRatings);

    if (!rubricValidation.ok) {
      return { ok: false, error: rubricValidation.error };
    }
  }

  if (report.requirementChecks !== undefined) {
    const requirementChecksValidation = validateRequirementChecks(report.requirementChecks);

    if (!requirementChecksValidation.ok) {
      return { ok: false, error: requirementChecksValidation.error };
    }
  }

  if (typeof report.summary !== "string") {
    return { ok: false, error: "分析结果 summary 必须是字符串。" };
  }

  if (typeof report.resumeOriginal !== "string") {
    return { ok: false, error: "分析结果 resumeOriginal 必须是字符串。" };
  }

  if (
    report.resumeDisplayText !== undefined &&
    typeof report.resumeDisplayText !== "string"
  ) {
    return { ok: false, error: "分析结果 resumeDisplayText 必须是字符串。" };
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

  if (!Array.isArray(report.annotations) || !report.annotations.every(isResumeAnnotation)) {
    return { ok: false, error: "分析结果 annotations 结构不正确。" };
  }

  if (!Array.isArray(report.segments) || !report.segments.every(isReportSegment)) {
    return { ok: false, error: "分析结果 segments 结构不正确。" };
  }

  return { ok: true, data: report as AnalysisReport };
}
