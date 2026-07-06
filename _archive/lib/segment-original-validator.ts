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

const MIN_NORMALIZED_CHARS_FOR_FUZZY = 6;

function unifyPunctuation(str: string): string {
  return str
    .replace(/。/g, ".") // 。
    .replace(/、/g, ",") // 、
    .replace(/，/g, ",") // ， (may survive NFKC in some contexts)
    .replace(/[‘’]/g, "'") // ' '
    .replace(/[“”]/g, '"') // " "
    .replace(/[—–]/g, "-") // — –
    .replace(/ /g, " "); // &nbsp;
}

function normalizeForMatching(text: string): string {
  let result = unifyPunctuation(text.normalize("NFKC"));
  result = result.replace(/\s*([,.;:!?])\s*/g, "$1");
  result = result.replace(/\s+/g, " ").trim();
  return result.toLowerCase();
}

type NormalizedMapping = {
  normalized: string;
  toOriginal: number[];
};

function buildNormalizedMapping(original: string): NormalizedMapping {
  const normalized = normalizeForMatching(original);

  if (normalized.length === 0) {
    return { normalized: "", toOriginal: [] };
  }

  const toOriginal: number[] = [];
  let normIdx = 0;

  for (let origIdx = 0; origIdx < original.length && normIdx < normalized.length; origIdx += 1) {
    const chNorm = normalizeForMatching(original[origIdx]);

    if (chNorm.length === 0) continue;

    for (let k = 0; k < chNorm.length && normIdx < normalized.length; k += 1) {
      if (chNorm[k] === normalized[normIdx]) {
        toOriginal.push(origIdx);
        normIdx += 1;
      }
    }
  }

  if (normIdx < normalized.length) {
    return buildNormalizedMappingByPrefix(original, normalized);
  }

  return { normalized, toOriginal };
}

function buildNormalizedMappingByPrefix(
  original: string,
  normalized: string
): NormalizedMapping {
  const toOriginal: number[] = new Array(normalized.length).fill(-1);
  let origIdx = 0;

  for (let normIdx = 0; normIdx < normalized.length; normIdx += 1) {
    while (origIdx < original.length) {
      const prefixNorm = normalizeForMatching(original.slice(0, origIdx + 1));
      if (prefixNorm.length > normIdx) {
        toOriginal[normIdx] = origIdx;
        break;
      }
      origIdx += 1;
    }
    if (toOriginal[normIdx] === -1) {
      toOriginal[normIdx] = origIdx > 0 ? origIdx : 0;
    }
  }

  return { normalized, toOriginal };
}

function matchesReviewText(reviewText: string, original: string): boolean {
  const trimmedOriginal = original.trim();

  if (!trimmedOriginal) {
    return false;
  }

  return reviewText.includes(trimmedOriginal);
}

export function validateSegmentOriginals(
  report: AnalysisReport,
  reviewText: string
): SegmentOriginalValidation {
  const issues = report.segments
    .filter((segment) => !matchesReviewText(reviewText, segment.original))
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
  reviewText: string
): AnalysisReport {
  const matchedSegments = report.segments.filter((segment: ReportSegment) =>
    matchesReviewText(reviewText, segment.original)
  );

  return {
    ...report,
    segments: matchedSegments
  };
}

export function locateResumeAnnotations(
  report: AnalysisReport,
  reviewText: string
): AnnotationOriginalValidation {
  const issues: AnnotationOriginalIssue[] = [];
  let nextSearchIndex = 0;
  let normalizedMapping: NormalizedMapping | null = null;

  function getNormalizedMapping(): NormalizedMapping {
    if (!normalizedMapping) {
      normalizedMapping = buildNormalizedMapping(reviewText);
    }
    return normalizedMapping;
  }

  const matchedAnnotations = (report.annotations ?? []).reduce<ResumeAnnotation[]>(
    (items, annotation) => {
      const original = annotation.original;

      if (!original) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      // Step 1: exact match
      const trimmedOriginal = original.trim();
      const exactStart = reviewText.indexOf(trimmedOriginal, nextSearchIndex);

      if (exactStart >= 0) {
        const endIndex = exactStart + trimmedOriginal.length;
        nextSearchIndex = endIndex;
        items.push({
          ...annotation,
          original: reviewText.slice(exactStart, endIndex),
          startIndex: exactStart,
          endIndex
        });
        return items;
      }

      // Step 2: normalized match (NFKC + punctuation + whitespace)
      const normalizedOriginal = normalizeForMatching(original);

      if ([...normalizedOriginal].length < MIN_NORMALIZED_CHARS_FOR_FUZZY) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const mapping = getNormalizedMapping();
      const normalizedSearchStart = normalizeForMatching(
        reviewText.slice(0, nextSearchIndex)
      ).length;
      const normStart = mapping.normalized.indexOf(normalizedOriginal, normalizedSearchStart);

      if (normStart < 0) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const normEnd = normStart + normalizedOriginal.length;
      const origStart = mapping.toOriginal[normStart];
      const origEnd = mapping.toOriginal[normEnd - 1] + 1;

      // Safety: verify the mapped slice normalizes to the same value
      const sliced = reviewText.slice(origStart, origEnd);
      if (normalizeForMatching(sliced) !== normalizedOriginal) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      nextSearchIndex = origEnd;

      items.push({
        ...annotation,
        original: reviewText.slice(origStart, origEnd),
        startIndex: origStart,
        endIndex: origEnd
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
