export type SegmentStatus = "relevant" | "optimize" | "irrelevant";

export type ReportSegment = {
  id: string;
  section: string;
  original: string;
  status: SegmentStatus;
  comment: string;
  suggestion: string;
};

export type SuggestionSummary = {
  label: string;
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

export type AnalysisReport = {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: SuggestionSummary[];
  history: HistoryItem[];
  segments: ReportSegment[];
};
