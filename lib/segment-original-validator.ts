import type { AnalysisReport, ReportSegment, ResumeAnnotation } from "@/types/analysis";

export type SegmentOriginalIssue = {
  id: string;
  original: string;
};

export type SegmentOriginalValidation = {
  ok: boolean;
  issues: SegmentOriginalIssue[];
};

export type AnnotationOriginalIssue = {
  id: string;
  original: string;
};

export type AnnotationOriginalValidation = {
  ok: boolean;
  report: AnalysisReport;
  issues: AnnotationOriginalIssue[];
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

export function locateResumeAnnotations(
  report: AnalysisReport,
  resumeText: string
): AnnotationOriginalValidation {
  const issues: AnnotationOriginalIssue[] = [];
  let nextSearchIndex = 0;

  const matchedAnnotations = (report.annotations ?? []).reduce<ResumeAnnotation[]>(
    (items, annotation) => {
      const original = annotation.original;

      if (!original) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const startIndex = resumeText.indexOf(original, nextSearchIndex);

      if (startIndex < 0) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const endIndex = startIndex + original.length;
      nextSearchIndex = endIndex;

      items.push({
        ...annotation,
        startIndex,
        endIndex
      });

      return items;
    },
    []
  );

  return {
    ok: issues.length === 0,
    report: {
      ...report,
      annotations: matchedAnnotations
    },
    issues
  };
}
