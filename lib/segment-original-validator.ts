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

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

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

function matchesResumeText(resumeText: string, original: string): boolean {
  const trimmedOriginal = original.trim();

  if (!trimmedOriginal) {
    return false;
  }

  if (resumeText.includes(trimmedOriginal)) {
    return true;
  }

  if (normalizeWhitespace(resumeText).includes(normalizeWhitespace(trimmedOriginal))) {
    return true;
  }

  const normalizedOriginal = normalizeForMatching(trimmedOriginal);

  if ([...normalizedOriginal].length < MIN_NORMALIZED_CHARS_FOR_FUZZY) {
    return false;
  }

  return normalizeForMatching(resumeText).includes(normalizedOriginal);
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
  let normalizedMapping: NormalizedMapping | null = null;

  function getNormalizedMapping(): NormalizedMapping {
    if (!normalizedMapping) {
      normalizedMapping = buildNormalizedMapping(resumeText);
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
      const exactStart = resumeText.indexOf(original, nextSearchIndex);

      if (exactStart >= 0) {
        const endIndex = exactStart + original.length;
        nextSearchIndex = endIndex;
        items.push({ ...annotation, startIndex: exactStart, endIndex });
        return items;
      }

      // Step 2: whitespace-normalized match
      const wsNormalizedOriginal = normalizeWhitespace(original);
      const wsNormalizedResume = normalizeWhitespace(resumeText);
      const wsStart = wsNormalizedResume.indexOf(wsNormalizedOriginal);

      if (wsStart >= 0 && [...wsNormalizedOriginal].length >= MIN_NORMALIZED_CHARS_FOR_FUZZY) {
        const mapping = getNormalizedMapping();

        const mapped = mapNormalizedRange(mapping, wsNormalizedOriginal, resumeText);

        if (mapped) {
          nextSearchIndex = mapped.endIndex;
          items.push({
            ...annotation,
            startIndex: mapped.startIndex,
            endIndex: mapped.endIndex
          });
          return items;
        }
      }

      // Step 3: full normalized match (NFKC + punctuation + whitespace)
      const normalizedOriginal = normalizeForMatching(original);

      if ([...normalizedOriginal].length < MIN_NORMALIZED_CHARS_FOR_FUZZY) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const mapping = getNormalizedMapping();
      const normStart = mapping.normalized.indexOf(normalizedOriginal);

      if (normStart < 0) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      const normEnd = normStart + normalizedOriginal.length;
      const origStart = mapping.toOriginal[normStart];
      const origEnd = mapping.toOriginal[normEnd - 1] + 1;

      // Safety: verify the mapped slice normalizes to the same value
      const sliced = resumeText.slice(origStart, origEnd);
      if (normalizeForMatching(sliced) !== normalizedOriginal) {
        issues.push({ id: annotation.id, original });
        return items;
      }

      nextSearchIndex = origEnd;

      items.push({
        ...annotation,
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

function mapNormalizedRange(
  mapping: NormalizedMapping,
  normalizedNeedle: string,
  resumeText: string
): { startIndex: number; endIndex: number } | null {
  const normStart = mapping.normalized.indexOf(normalizedNeedle);

  if (normStart < 0) {
    return null;
  }

  const normEnd = normStart + normalizedNeedle.length;
  const origStart = mapping.toOriginal[normStart];
  const origEnd = mapping.toOriginal[normEnd - 1] + 1;

  const sliced = resumeText.slice(origStart, origEnd);
  if (normalizeWhitespace(sliced) !== normalizedNeedle) {
    return null;
  }

  return { startIndex: origStart, endIndex: origEnd };
}
