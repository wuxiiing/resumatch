export type SegmentStatus = "relevant" | "optimize" | "irrelevant";

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

export type AnalysisReport = {
  score: number;
  summary: string;
  jobDirection: JobDirectionItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: SuggestionSummary[];
  history: HistoryItem[];
  segments: ReportSegment[];
};
