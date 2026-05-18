import type { AnalysisReport, ReportSegment } from "@/types/analysis";

export type SegmentOriginalIssue = {
  id: string;
  original: string;
};

export type SegmentOriginalValidation = {
  ok: boolean;
  issues: SegmentOriginalIssue[];
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function matchesResumeText(resumeText: string, original: string): boolean {
  const trimmedOriginal = original.trim();

  if (!trimmedOriginal) {
    return false;
  }

  if (resumeText.includes(trimmedOriginal)) {
    return true;
  }

  return normalizeWhitespace(resumeText).includes(normalizeWhitespace(trimmedOriginal));
}

export function validateSegmentOriginals(
  report: AnalysisReport,
  resumeText: string
): SegmentOriginalValidation {
  const issues = report.segments
    .filter((segment) => !matchesResumeText(resumeText, segment.original))
    .map((segment) => ({
      id: segment.id,
      original: segment.original
    }));

  return {
    ok: issues.length === 0,
    issues
  };
}

export function filterUnmatchedSegments(
  report: AnalysisReport,
  resumeText: string
): AnalysisReport {
  const matchedSegments = report.segments.filter((segment: ReportSegment) =>
    matchesResumeText(resumeText, segment.original)
  );

  return {
    ...report,
    segments: matchedSegments
  };
}

