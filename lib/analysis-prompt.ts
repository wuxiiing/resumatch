import type { AnalyzeRequest } from "@/lib/analysis-schema";
import type { SegmentOriginalIssue } from "@/lib/segment-original-validator";

const outputShapeDescription = `{
  "score": 0,
  "summary": "中文总结",
  "resumeOriginal": "",
  "jobDirection": [
    { "label": "JD 关注点", "description": "中文说明" }
  ],
  "matchedKeywords": ["React"],
  "missingKeywords": ["SQL"],
  "suggestions": [
    { "label": "技能层面", "description": "中文建议", "count": 1 }
  ],
  "history": [
    { "id": "history-1", "company": "目标岗位", "role": "岗位方向", "time": "本次分析", "score": 0, "active": true }
  ],
  "annotations": [
    {
      "id": "annotation-1",
      "original": "必须严格引用简历连续原文",
      "status": "improve",
      "relatedJdNeed": "来自 JD 的明确岗位痛点或能力要求",
      "reason": "中文说明为什么这段原文与 JD 痛点相关",
      "suggestion": "中文批改建议",
      "rewriteExample": "针对 improve 状态给出的改写示例",
      "section": "项目经历",
      "startIndex": 0,
      "endIndex": 10
    }
  ],
  "segments": [
    {
      "id": "segment-1",
      "section": "项目经历",
      "original": "必须严格引用简历原文片段",
      "status": "relevant",
      "comment": "中文分析",
      "suggestion": "中文建议"
    }
  ]
}`;

export const analysisSystemPrompt = `你是 ResuMatch 的简历与岗位 JD 匹配分析器。

你必须只输出合法 JSON / json object，不要输出 Markdown、代码块、解释性前后缀或多余文本。
JSON object 必须符合 AnalysisReport 结构，字段包括 score、summary、resumeOriginal、jobDirection、matchedKeywords、missingKeywords、suggestions、history、annotations、segments。

语言和内容规则：
1. 分析说明、建议、错误解释默认使用中文，方便中文用户阅读。
2. 不要强行翻译 JD 或简历中的英文专有名词。
3. 技能、工具、证书、岗位名、公司业务名、英文关键词应保留原文，例如 React、TypeScript、SQL、A/B Testing、Product Analyst。
4. segments.original 必须逐字复制 resumeText 中的一段连续原文，保持原语言，不得翻译、改写、概括、补字、纠错或润色。
5. matchedKeywords 和 missingKeywords 可以保留 JD 中原始关键词语言；如果 JD 是英文，关键词可为英文。
6. 如果需要解释英文关键词，可以在中文建议中解释，但不要改变关键词本身。
7. 不输出完整简历原文；resumeOriginal 必须返回空字符串 ""，完整简历由系统本地保留。
8. 不添加登录、付费、PDF 导出、一键改写等范围外内容。
9. 找不到明确片段时不要编造原文，segments 只放能从简历中找到的连续原文片段。
10. segments.original 不能把多个不连续片段拼成一个 original。
11. 如果某个分析点找不到可逐字复制的连续原文片段，不要生成该 segment。
12. annotations 用于“基于 JD 的简历原文批改视图”，必须围绕 JD 痛点标注简历原文。
13. annotations.original 必须逐字引用 resumeText 中的一段连续原文，不得翻译、改写、概括、补字、纠错、润色或拼接不连续片段。
14. 普通无关但无害、无需修改的内容不要生成 annotation；只标注对 JD 匹配判断有帮助的保留点、需要增强点或建议删除点。
15. annotations.status 只能是 keep、improve、remove，三态语义必须严格区分：keep 表示该原文强支撑 JD 痛点且建议保留；improve 表示该原文有价值但表达不足，需要改写增强；remove 表示该原文与 JD 痛点冲突、稀释重点或占用篇幅，建议删除或大幅压缩。
16. annotations.relatedJdNeed 必须来自岗位 JD 中明确或可合理归纳的痛点、职责、技能、经验或评估标准，不得泛泛填写。
17. status 为 improve 时，rewriteExample 必须提供可替换原文的中文改写示例；keep 和 remove 可返回空字符串。
18. annotations.section、startIndex、endIndex 无法可靠判断时可以省略；如果提供，startIndex 和 endIndex 必须是数字。

segments.status 只能是 relevant、optimize、irrelevant。
annotations.status 只能是 keep、improve、remove。
score 必须是 0 到 100 的数字。
suggestions.count 必须是数字。
resumeOriginal 必须是空字符串，不要把完整 resumeText 放入 JSON。

完整目标 JSON object 示例结构：
${outputShapeDescription}`;

function buildOriginalCorrectionPrompt(issues: SegmentOriginalIssue[]): string {
  if (issues.length === 0) {
    return "";
  }

  const issueLines = issues
    .map((issue) => `- segment id ${issue.id} 的 original 未在 resumeText 中命中：${issue.original}`)
    .join("\n");

  return `

上一次输出中，下列 segments.original 没有在 resumeText 中逐字命中：
${issueLines}

请重新输出完整 JSON，并修正这些 segment：
1. 每个 segments.original 必须是 resumeText 中可以直接 includes 命中的连续原文片段。
2. 不得翻译、改写、概括、补字、纠错、润色。
3. 不得拼接多个不连续片段。
4. 找不到可直接引用的连续原文时，删除该 segment。
5. annotations.original 也必须遵守同样的连续原文逐字引用规则。`;
}

function buildJsonRepairPrompt(jsonRepairReason: string | null): string {
  if (!jsonRepairReason) {
    return "";
  }

  return `

上一次输出不是可解析且符合要求的合法 JSON object。
问题摘要：${jsonRepairReason}

请重新输出完整、合法、可直接 JSON.parse 的 JSON object：
1. 只输出 JSON object 本身。
2. 不要 Markdown，不要 \`\`\`json 代码块。
3. 不要在 JSON 前后添加解释文字。
4. 保持字段与完整目标 JSON object 示例一致。`;
}

export function buildAnalysisUserPrompt(
  request: AnalyzeRequest,
  originalIssues: SegmentOriginalIssue[] = [],
  jsonRepairReason: string | null = null
): string {
  return `请根据下面的简历文本和岗位 JD，返回一个符合 AnalysisReport 结构的合法 JSON object。

简历文本：
${request.resumeText}

岗位 JD：
${request.jobDescription}${buildOriginalCorrectionPrompt(originalIssues)}${buildJsonRepairPrompt(jsonRepairReason)}`;
}
