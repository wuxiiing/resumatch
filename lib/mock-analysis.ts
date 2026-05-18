import { placeholderReport } from "@/lib/mock-report";
import type { AnalysisReport } from "@/types/analysis";

export function createMockAnalysisReport(): AnalysisReport {
  return structuredClone(placeholderReport);
}
