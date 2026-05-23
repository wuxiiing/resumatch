export type SegmentStatus = "relevant" | "optimize" | "irrelevant";

export type AnnotationStatus = "keep" | "improve" | "remove";

export type ResumeFileType = "docx" | "xlsx" | "pdf" | "txt";

export type RubricRatingLevel = "strong" | "medium" | "weak" | "missing";

export type RubricRating = {
  level: RubricRatingLevel;
  evidence: string;
  gap: string;
};

export type RubricRatings = {
  hardSkillMatch: RubricRating;
  evidenceStrength: RubricRating;
  businessContext: RubricRating;
  quantifiedResult: RubricRating;
  resumeClarity: RubricRating;
};

export type RequirementCheckPriority = "must" | "preferred" | "context";

export type RequirementCheckStatus = "present" | "weak" | "missing";

export type RequirementCheck = {
  label: string;
  priority: RequirementCheckPriority;
  status: RequirementCheckStatus;
  evidence: string;
  note: string;
};

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
  rubricRatings?: RubricRatings;
  requirementChecks?: RequirementCheck[];
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
