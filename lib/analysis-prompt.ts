import type { AnalyzeRequest } from "@/lib/analysis-schema";
import type { SegmentOriginalIssue } from "@/lib/segment-original-validator";

const outputShapeDescription = `{
  "score": 0,
  "rubricRatings": {
    "hardSkillMatch": { "level": "medium", "evidence": "中文证据摘要", "gap": "中文差距摘要" },
    "evidenceStrength": { "level": "medium", "evidence": "中文证据摘要", "gap": "中文差距摘要" },
    "businessContext": { "level": "medium", "evidence": "中文证据摘要", "gap": "中文差距摘要" },
    "quantifiedResult": { "level": "weak", "evidence": "中文证据摘要", "gap": "中文差距摘要" },
    "resumeClarity": { "level": "strong", "evidence": "中文证据摘要", "gap": "中文差距摘要" }
  },
  "requirementChecks": [
    {
      "label": "SQL",
      "priority": "must",
      "status": "missing",
      "evidence": "",
      "note": "JD 明确要求 SQL，简历未找到对应证据"
    }
  ],
  "summary": "中文总结",
  "resumeOriginal": "",
  "resumeDisplayText": "只整理换行、空格、栏目标题和 bullet 后的展示底文",
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
      "reason": "说明这段为何关联 JD、现有表达的短板或保留价值",
      "suggestion": "指出应补场景、动作、结果、指标、工具或业务价值中的哪一类",
      "rewriteExample": "按 STAR 给出可直接替换的改写句，缺真实数据时写可补充真实数据",
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
JSON object 必须符合 AnalysisReport 结构，字段包括 score、rubricRatings、requirementChecks、summary、resumeOriginal、resumeDisplayText、jobDirection、matchedKeywords、missingKeywords、suggestions、history、annotations、segments。
注意：score（输出 0）、matchedKeywords（输出 []）、missingKeywords（输出 []）、history（输出单个占位条目即可）均由后端计算生成，你只需输出占位值。

语言和内容规则：
1. 分析说明、建议、错误解释默认使用中文，方便中文用户阅读。
2. 不要强行翻译 JD 或简历中的英文专有名词。
3. 技能、工具、证书、岗位名、公司业务名、英文关键词应保留原文，例如 React、TypeScript、SQL、A/B Testing、Product Analyst。
4. segments.original 必须逐字复制最终 resumeDisplayText 中的一段连续文本，保持原语言，不得翻译、改写、概括、补字、纠错或润色。
5. 如果需要解释英文关键词，可以在中文建议中解释，但不要改变关键词本身。
7. 不输出完整简历原文；resumeOriginal 必须返回空字符串 ""，完整简历由系统本地保留。
7a. resumeDisplayText 是结果页展示底文，不是摘要、不是润色版、不是分析报告。
7b. 如果 resumeText 有随机断行、断词、过多空行，必须修复；如果 resumeText 已经干净，resumeDisplayText 可以接近原文，不要为了“不一样”强行改动。
7c. resumeDisplayText 只允许调整换行、空格、栏目标题独立行、bullet 换行；禁止改写语言、补经历、删实质内容、总结成摘要。
7d. 栏目标题独立成行；bullet 每条独立成行；联系方式独立成行；连续空行最多一个。
7e. resumeDisplayText 不得加入 JD、匹配度、分析报告、岗位要求、建议 等分析性底文。
8. 不添加登录、付费、PDF 导出、一键改写等范围外内容。
9. 找不到明确片段时不要编造文本，segments 只放能从最终 resumeDisplayText 中找到的连续文本片段。
10. segments.original 不能把多个不连续片段拼成一个 original。
11. 如果某个分析点找不到可逐字复制的连续展示底文片段，不要生成该 segment。
12. annotations 是核心输出，用于”基于 JD 的简历原文批改视图”。必须输出标注，禁止返回空数组 []。不要使用保守固定数量策略；改为按简历长度、栏目丰富度、JD 相关证据密度动态输出尽可能多的有用批注，硬上限 15 条。
12a. 数量参考：短简历通常 5-8 条；普通简历通常 8-12 条；内容丰富简历可到 12-15 条。内容极少时可以少于 5 条，但必须在 summary 或 jobDirection 说明证据不足，不能假装有充分证据。
12b. 每条 annotation 必须有实际修改价值、能定位到最终 resumeDisplayText 的连续片段、只分析一件事。不为了凑数量标注无害基础信息，也不要把不同栏目或不连续事实拼成一条。
13. annotations.original 必须逐字引用最终 resumeDisplayText 中的一段连续文本，优先选择 15-60 字的短片段。不得翻译、改写、概括、补字、纠错、润色或拼接不连续片段。每条 annotation 只围绕原文中的”一件事”分析。
13a. annotations 覆盖策略必须按 JD 相关证据和修改价值动态选择，不要机械按栏目配额打卡；优先选择最能证明岗位能力、最值得改写增强的原文证据。
13b. 可覆盖对象包括：个人总结/自我评价、项目/论文项目/课程设计/毕设、实习/工作、科研/论文/发表期刊、校园经历/学生会/社团/志愿服务/义务劳动、竞赛/奖项/荣誉/证书、技能描述。
13c. 个人总结/自我评价：有明确岗位相关能力、经历方向或优势时可标；空泛口号如果占用篇幅且影响重点，可标 improve 或少量 remove。
13d. 项目、论文项目、课程设计、毕设：与 JD 业务、技术、研究、数据、运营或产品能力相关时优先标注，重点看背景/问题、动作、能力、目的或结果是否完整。
13e. 实习/工作：与 JD 职责或能力要求相关时优先标注，重点看职责动作、业务场景、产出结果和可验证证据。
13f. 科研、论文、发表期刊：能证明研究、数据、专业理解、技术表达时应纳入，重点指出研究问题、方法、贡献或产出是否清楚。
13g. 校园经历、学生会、社团、志愿服务、义务劳动：只有能证明组织、沟通、运营、执行、服务意识且与 JD 有转化价值时才标。
13h. 竞赛、奖项、荣誉、证书：能支撑岗位能力时才标；技能描述只有与 JD 核心硬要求相关时才标，避免把技能清单逐项拆成低价值批注。
13i. 不标联系方式、普通学校名称、普通时间地点、普通学历字段、无害基础信息；技能清单不要拆成多条低价值 annotation。
14. 如果简历中有与 JD 明确匹配的经历或技能描述，至少输出 1 条 keep 标注，说明该原文如何支撑 JD 痛点。
15. improve 是主力批注。如果简历中有表达可优化的内容，应尽量输出多条 improve，重点指出缺场景、缺动作、缺结果、缺量化、缺工具、缺业务价值或缺 JD 关键词承接，并提供可直接替换进简历的完整改写示例。
16. remove 为可选项，仅在原文明显弱相关、稀释重点、与 JD 冲突或占用篇幅时少量输出，最多 2 条。没有需要删除的内容时可不输出 remove。
17. annotations.status 三态语义：keep = 原文强支撑 JD 痛点建议保留；improve = 原文有价值但表达不足需要改写增强；remove = 原文与 JD 冲突或稀释重点建议删除或压缩。
18. annotations.relatedJdNeed 保持短标签且不超过 30 字。应尽量复用对应 requirementChecks 中的 label 措辞；若 annotation 无直接对应的 requirementCheck，才使用简短 JD 能力标签。不强制 annotations 与 requirementChecks 一一对应。reason 可到约 80 字，suggestion 可到约 120 字，rewriteExample 可到约 160 字。不要为了变长而空泛重复。
18a. reason 要像简历教练：说明这段为什么和 JD 有关、能证明什么，或指出问题在哪里，例如缺少业务场景、动作责任、结果证据、工具方法或岗位关键词承接。
18b. suggestion 要具体指出该补哪一类信息：场景、动作、结果、指标、工具、业务价值或 JD 关键词。禁止只写“建议优化表达”“建议补充细节”这类空泛话。
19. status 为 improve 时 rewriteExample 必填非空，提供可直接替换进简历的完整句子；keep 可省略 rewriteExample 或返回空字符串；remove 可省略或给出简短压缩/删除建议。
19a. rewriteExample 只能基于 annotation.original 或 resumeDisplayText 中已有事实优化表达。
19b. improve 的 rewriteExample 按 STAR 思路组织成一句或两句可替换文本：背景/问题、动作、能力/工具、目的或结果都要尽量出现；如果原文没有工具或结果，不得新编，只能提示候选人“可补充真实数据”。
19c. 禁止虚构任何数字或量化 claim，包括用户数、准确率、效率提升、转化率、节省时间、营收、排名、获奖、增长率。
19d. 禁止虚构任何经历、项目、公司、岗位、成果、工具、责任或新成就。
19e. 如果原文缺少真实量化数据，不要编数字，只能写：可补充真实数据：如使用人数、效率提升比例、反馈结果等。不能把占位提示扩展成看似真实的数字结论。
20. annotations.section、startIndex、endIndex 无法可靠判断时可省略。

# 根据 requirementChecks 与 JD 差距决定分析重点

21. 根据 requirementChecks 的检查结果决定分析策略和 summary 语气。区分 missing（完全缺失）与 weak（方向对但证据浅），weak 是 requirementChecks 的合法状态必须使用：
  - 若 missing must ≤ 0 且 missing preferred ≤ 1：简历与 JD 方向匹配。重点润色表达、补量化数据、强化 JD 关键词覆盖。方向相关但证据浅的技能/经验标为 weak，不要一律标 present。summary 肯定匹配基础，列出 1-2 个微小优化方向。
  - 若 missing must ≤ 1 且 missing preferred ≤ 3：简历方向正确但证据有缺口。方向对但证据浅的项标为 weak 而非 missing，weak 是本档主力状态。重点加强项目深度、补量化结果、补充弱项技能的证据。summary 肯定匹配方向并诚实指出差距。
  - 若 missing must ≥ 2：简历与 JD 存在硬性差距。缺硬技能标 missing，方向相关但证据浅的标 weak（不要全标 missing）。jobDirection 列硬性差距和补强路径。summary 坦诚给方向建议，不假装匹配。
22. summary 语气必须与 requirementChecks 结果一致，不得与 annotations 的判断互相矛盾。匹配好时不虚夸，有差距时鼓励为主，差距大时诚实不羞辱。

# JD 三层穿透法

23. 先理解 JD，再匹配简历，不要直接做关键词扫描。
24. 文本拆解：识别业务方向、核心职责、硬性要求、软性能力、优先级词、限定词。
25. 逻辑串联：判断岗位类型、业务场景、工作模式、核心目标。
26. 本质提炼：提炼简历需要证明的硬技能证据、业务认知、软能力体现。
27. jobDirection 必须承接三层分析；每条尽量包含业务本质、已有证据、真实差距、补强方向，不要只列关键词。
28. requirementChecks 必须在理解 JD 后先提取 JD 检查项，再结合简历判断 present、weak 或 missing。
29. 每个 requirementCheck 只能包含 label、priority、status、evidence、note；不要输出其他扩展字段。
30. priority 只能是 must、preferred、context；status 只能是 present、weak、missing。
31. label 必须是短关键词：2-8 个中文字符或 1-3 个英文词。禁止短语、短句、解释性描述。正确示例："用户反馈分析""数据分析""SQL""AI工具落地"。错误示例："用户反馈收集与分析经验""数据运营业务成果展示不足"。must 只用于 JD 明确要求或强筛选条件，preferred 用于优先/加分项，context 用于业务场景、行业、协作方式等背景匹配项。
32. evidence 必须来自简历已有事实；找不到证据时写空字符串，并将 status 设为 missing。不要为了凑 present 编造 evidence。
33. requirementChecks.status 三态统一定义（适用于所有 JD 检查项，不得跳过 weak 直接做 present/missing 二分）：

present — JD 要求在简历中存在明确、直接、可验证的证据：
  - 技能出现在项目/实习/工作经历中，有动作或产出描述
  - 技能被明确列出且关联到具体使用场景、任务或成果
  标准：能直接作为面试追问的起点。

weak — JD 要求的方向与简历内容相关，但证据不够直接或不够深入：
  - 提到了相关能力或概念，但缺项目/场景/动作/结果支撑
  - 提到了相邻工具或技能，但非 JD 要求的那个（如 JD 要 SQL 但只有 Excel）
  - 经历涉及相关领域，但职责描述偏泛，无具体任务或产出
  标准：有方向关联但面试追问会答不深。

missing — JD 要求在简历中完全未提及，或仅出现字面匹配但无任何实际证据。

few-shot 判定示例（泛化，不涉及任何具体项目名或用户名）：

示例1：JD 要求"数据分析能力"，简历描述"使用 Excel 整理经营数据并输出月度报表" → present。技能+工具+动作+产出四项齐全。

示例2：JD 要求"用户反馈分析"，简历描述"参与问卷设计" → weak。方向相关（用户调研），但问卷设计 ≠ 反馈分析，且无分析动作或结论。

示例3：JD 要求"SQL"，简历描述"使用 Excel 整理数据" → missing。Excel 不是 SQL，相邻工具不等价，按缺失处理。


segments.status 只能是 relevant、optimize、irrelevant。
annotations.status 只能是 keep、improve、remove。
score 固定输出 0，由后端根据 rubricRatings 和 requirementChecks 计算后覆盖。
matchedKeywords 输出空数组 []，由后端从 requirementChecks 派生后覆盖。
missingKeywords 输出空数组 []，由后端从 requirementChecks 派生后覆盖。
history 输出单个占位条目即可，由后端管理。
rubricRatings 必须输出五个维度：hardSkillMatch、evidenceStrength、businessContext、quantifiedResult、resumeClarity。
每个 rubricRatings 维度必须包含 level、evidence、gap；level 只能是 strong、medium、weak、missing。
不要输出自由数字子分或 numeric subscores。
suggestions.count 必须是数字。
resumeOriginal 必须是空字符串，不要把完整 resumeText 放入 JSON。

重要：annotations 和 segments 是必须输出的核心字段，禁止返回空数组 []。
依赖关系：先确定最终采用的 resumeDisplayText；annotations.original 和 segments.original 必须逐字引用该 resumeDisplayText 中的连续文本。

完整目标 JSON object 示例结构：
${outputShapeDescription}`;

export function buildEmptyAnnotationsRepairPrompt(): string {
  return `

[重试指令] 上一次输出 annotations 为空数组。
请按简历长度、栏目丰富度和 JD 相关证据密度动态输出 annotations，硬上限 15 条：短简历通常 5-8 条，普通简历通常 8-12 条，内容丰富简历可到 12-15 条。
内容极少时可以少于 5 条，但需要在 summary 或 jobDirection 中说明证据不足。至少 1 条 keep 或 1 条 improve，improve 是主力。
original 必须逐字引用简历连续原文，优先 15-60 字片段。
每条只分析一件事；不要标联系方式、普通学校名称、普通时间地点或无害基础信息。
rewriteExample 按 STAR 思路写：背景/问题、动作、能力、目的或结果；没有真实数据时只能提示“可补充真实数据”，不能编数字。
保留字段长度限制：relatedJdNeed≤30、reason约≤80、suggestion约≤120、rewriteExample约≤160。reason 要说明 JD 相关性或问题；suggestion 要点明补场景、动作、结果、指标、工具或业务价值中的哪一类。`;
}

function buildOriginalCorrectionPrompt(issues: SegmentOriginalIssue[]): string {
  if (issues.length === 0) {
    return "";
  }

  const issueLines = issues
    .map((issue) => `- segment id ${issue.id} 的 original 未在最终 resumeDisplayText 中命中：${issue.original}`)
    .join("\n");

  return `

上一次输出中，下列 segments.original 没有在最终 resumeDisplayText 中逐字命中：
${issueLines}

请重新输出完整 JSON，并修正这些 segment：
1. 每个 segments.original 必须是最终 resumeDisplayText 中可以直接 includes 命中的连续文本片段。
2. 不得翻译、改写、概括、补字、纠错、润色。
3. 不得拼接多个不连续片段。
4. 找不到可直接引用的连续原文时，删除该 segment。
5. annotations.original 也必须遵守同样的连续展示底文逐字引用规则。
6. rewriteExample 不得加入原文没有的数字、百分比、增长率、用户数、准确率、排名、营收或获奖结果。`;
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
${request.jobDescription}${buildOriginalCorrectionPrompt(originalIssues)}${buildJsonRepairPrompt(jsonRepairReason)}

重要：annotations 和 segments 禁止返回空数组 []。annotations 动态数量，短简历通常 5-8 条、普通简历通常 8-12 条、内容丰富简历可到 12-15 条，硬上限 15 条；内容极少可少于 5 条，但要说明证据不足。根据 requirementChecks 差距选择 keep/improve/remove（至少 1 条 keep 或 1 条 improve），improve 是主力，不要机械覆盖所有栏目，不要标无害基础信息。
批注质量：不要改变 annotations 数量目标，只提高每条信息量。reason 说明 JD 相关性或具体问题；suggestion 点明要补场景、动作、结果、指标、工具或业务价值中的哪一类；rewriteExample 按 STAR 写成可替换句，没有真实数据时只写“可补充真实数据”，不能编数字。

分析顺序：
1. 先按三层穿透法理解 JD：文本拆解、逻辑串联、本质提炼，形成岗位方向和要求判断。
2. 提取 JD 检查项 requirementChecks，再结合简历判断 present / weak / missing；找不到证据不要编造。
3. 再阅读简历并整理 resumeDisplayText，只修复随机断行、空格、栏目标题、bullet 和联系方式换行。
4. 再基于整理后的简历原文生成 annotations 和 segments，确保 original 都能逐字定位。
5. 最后生成 summary 和 jobDirection（基于 requirementChecks 结果和三层穿透分析）。score、matchedKeywords、missingKeywords、history 输出占位值（0、[]、[]、单个占位条目）。`;
}
