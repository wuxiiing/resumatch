export type SegmentStatus = "relevant" | "optimize" | "irrelevant";

export type AnnotationStatus = "keep" | "improve" | "remove";

export type ReportSegment = {
  id: string;
  section: string;
  original: string;
  status: SegmentStatus;
  comment: string;
  suggestion: string;
};

export type JobDirectionItem = {
  label: string;
  description: string;
};

export type SuggestionSummary = {
  label: string;
  description: string;
  count: number;
};

export type HistoryItem = {
  id: string;
  company: string;
  role: string;
  time: string;
  score: number;
  active?: boolean;
};

export type ResumeAnnotation = {
  id: string;
  original: string;
  status: AnnotationStatus;
  relatedJdNeed: string;
  reason: string;
  suggestion: string;
  rewriteExample?: string;
  section?: string;
  startIndex?: number;
  endIndex?: number;
};

export type AnalysisReport = {
  score: number;
  summary: string;
  resumeOriginal?: string;
  resumeDisplayText?: string;
  jobDirection: JobDirectionItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: SuggestionSummary[];
  history: HistoryItem[];
  annotations?: ResumeAnnotation[];
  segments: ReportSegment[];
};
