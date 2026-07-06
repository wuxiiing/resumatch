import { placeholderReport } from "@/lib/mock-report";
import { locateResumeAnnotations } from "@/lib/segment-original-validator";
import type { AnalysisReport } from "@/types/analysis";

export function createMockAnalysisReport(): AnalysisReport {
  const report = structuredClone(placeholderReport);
  const resumeOriginal = report.segments.map((segment) => segment.original).join("\n");

  const reportWithAnnotations: AnalysisReport = {
    ...report,
    resumeOriginal,
    annotations: [
      {
        id: "annotation-1",
        original: report.segments[0]?.original ?? "",
        status: "keep",
        relatedJdNeed: "工具型产品的前端实现与组件化交付能力",
        reason: "这段经历直接证明候选人能拆分页面模块并沉淀组件规范。",
        suggestion: "保留该经历，并在正式简历中继续突出工具产品和组件规范沉淀。",
        rewriteExample: "",
        section: "项目经历"
      },
      {
        id: "annotation-2",
        original: report.segments[1]?.original ?? "",
        status: "improve",
        relatedJdNeed: "用数据或用户反馈证明流程优化结果",
        reason: "原文覆盖了反馈整理和信息层级调整，但缺少可判断的结果。",
        suggestion: "补充反馈样本、指标口径或效率变化，让成果更贴近 JD 的结果导向。",
        rewriteExample:
          "基于用户反馈优化岗位匹配流程，调整报告信息层级并补充关键指标说明，提升用户理解和决策效率。",
        section: "项目经历"
      },
      {
        id: "annotation-3",
        original: report.segments[2]?.original ?? "",
        status: "remove",
        relatedJdNeed: "聚焦前端产品、数据分析和工具交付经验",
        reason: "该内容偏通用校园协调经历，对目标岗位的核心能力支撑较弱。",
        suggestion: "删除或压缩为一句，给更贴近 JD 的项目成果留出篇幅。",
        rewriteExample: "",
        section: "校园经历"
      }
    ]
  };

  return locateResumeAnnotations(reportWithAnnotations, resumeOriginal).report;
}
