# ResuMatch 项目实现记录

> 本文件用于记录已完成 checkpoint、当前待合并验收任务和正式版前风险。它只做进度说明，不替代 `TASKS.md`、`PROJECT_WORKFLOW.md` 或 `PRODUCTION_CHECKLIST.md`。

## 维护规则

1. 本文件由总控室维护。项目负责人只需要把施工窗口和测试验收窗口的回执贴回总控室。
2. 总控室根据回执更新本文件，记录任务编号、完成内容、改动文件、验证结果、风险、是否 checkpoint 和提交 hash。
3. 临时侦察/文档窗口只作为一次性辅助，不作为长期记录负责人。
4. 新总控窗口接管时，应先阅读 `PROJECT_SCOPE.md`、`PROJECT_WORKFLOW.md`、`TASKS.md`、`PRODUCTION_CHECKLIST.md` 和本文件，再判断下一步。
5. 本文件不能替代正式 handoff。总控窗口需要迁移时，仍应给出短 handoff；但本文件应减少 handoff 对旧聊天记忆的依赖。

## 当前状态总览

- 状态：多格式解析链路已完成统一合并验收和 checkpoint。
- 当前已完成范围：`.docx` / `.xlsx` / 文字型 `.pdf` / UTF-8 `.txt` 解析链路，首页多格式上传预览，简历 3000 字限制，JD 1000 字联动。
- 验收节奏：按 `PROJECT_WORKFLOW.md` 的合并验收 / checkpoint 规则，由测试验收窗口统一检查范围、依赖、构建、lint、密钥和风险。
- 正式版风险记录：以 `PRODUCTION_CHECKLIST.md` 为准，尤其是依赖 audit、Node 版本、API Key 环境变量和未接入能力边界。

## 已 checkpoint 的关键提交

### ac43a06：前端首页和报告页 UI checkpoint

- 状态：已 checkpoint。
- 主要内容：首页和报告页 UI 阶段性存档。
- 验证摘要：作为前端页面骨架和视觉基线，后续页面施工应保持已验收风格，不自行扩展业务能力。

### b215846：首页 opening animation checkpoint

- 状态：已 checkpoint。
- 主要内容：首页开场动画阶段性存档。
- 验证摘要：动画体验已单独 checkpoint；正式版前仍需按 `PRODUCTION_CHECKLIST.md` 检查重播按钮、遮挡时长和 `prefers-reduced-motion`。

### 43df1e1：docx 解析主链路 checkpoint

- 状态：已 checkpoint。
- 主要内容：`.docx` 简历解析主链路。
- 验证摘要：作为后续 `.xlsx`、文字型 `.pdf`、UTF-8 `.txt` 多格式解析的回归基线。

### 60190e0：JD 1000 字限制 checkpoint

- 状态：已 checkpoint。
- 主要内容：目标岗位描述 1000 字限制。
- 验证摘要：后续多格式上传接入时，需要继续保持 JD 字数限制联动，不允许超限内容进入分析流程。

### a826b67：多格式简历解析链路 checkpoint

- 状态：已 checkpoint。
- 包含任务：RM-0014、RM-0015、RM-0017、RM-0018，以及相关流程文档和正式版清单更新。
- 主要内容：`.xlsx` 后端解析、`.xlsx` 前端上传预览、文字型 `.pdf` 后端解析、UTF-8 `.txt` 后端解析、`.pdf` / `.txt` 前端上传预览。
- 验证摘要：`lint` 通过、`build` 通过、secret 检查通过；`.docx` / `.xlsx` / 文字型 `.pdf` / UTF-8 `.txt` API 验证通过；空白 PDF 返回中文错误且不做 OCR；非支持格式返回中文错误；移动端无横向溢出。
- 已知风险：`xlsx` high audit、`next/postcss` moderate audit、`pdfjs-dist` Node/Vercel 兼容风险已记录到 `PRODUCTION_CHECKLIST.md`，未执行未授权的 `npm audit fix`。

## 已完成任务摘要

### RM-0014：xlsx 后端解析

- 状态：已随 `a826b67` checkpoint。
- 对应文件：
  - `app/api/parse-resume/route.ts`
  - `lib/parse-xlsx.ts`
  - `package.json`
  - `package-lock.json`
- 主要内容：新增 `.xlsx` 后端文本解析能力，并新增 `xlsx` 依赖。
- 验证摘要：统一验收确认 `.xlsx` API 解析成功，`.docx` 回归通过，新增依赖风险已记录。

### RM-0015：xlsx 前端接入

- 状态：已随 `a826b67` checkpoint。
- 对应文件：
  - `components/FileUploader.tsx`
- 主要内容：首页上传组件支持 `.xlsx` 上传、文本预览和错误提示。
- 验证摘要：统一验收确认 `.xlsx` 上传预览可用，简历 3000 字限制沿用，`.docx` 上传预览无回归。

### RM-0017：文字型 PDF 与 UTF-8 txt 后端解析

- 状态：已随 `a826b67` checkpoint。
- 对应文件：
  - `lib/parse-pdf.ts`
  - `lib/parse-txt.ts`
  - `app/api/parse-resume/route.ts`
  - `package.json`
  - `package-lock.json`
- 主要内容：新增文字型 `.pdf` 和 UTF-8 `.txt` 后端文本解析能力，并新增 `pdfjs-dist` 依赖。
- 验证摘要：统一验收确认文字型 PDF 可提取文本、空白 PDF 有清楚中文错误、UTF-8 txt 可解析；Vercel Node 版本兼容风险已记录。

### RM-0018：pdf / txt 前端接入

- 状态：已随 `a826b67` checkpoint。
- 对应文件：
  - `components/FileUploader.tsx`
- 主要内容：首页上传组件支持 `.pdf` / `.txt` 上传预览和错误展示。
- 验证摘要：统一验收确认 `.pdf` / `.txt` 上传预览、空白 PDF 错误、简历 3000 字限制、`.docx` / `.xlsx` 回归，以及 JD 1000 字联动无回归。

### RM-0019：DeepSeek 分析接口 schema 与输入输出边界

- 状态：待后续 DeepSeek 调用层一起合并验收。
- 对应文件：
  - `app/api/analyze/route.ts`
  - `lib/analysis-schema.ts`
  - `lib/mock-analysis.ts`
- 主要内容：新增 `POST /api/analyze` 骨架；校验 `resumeText` 非空且不超过 3000 字、`jobDescription` 非空且不超过 1000 字；返回符合 `types/analysis.ts` 的 mock `AnalysisReport`；使用手写类型守卫校验输出结构。
- 验证摘要：合法请求返回结构化 JSON；空简历、超 3000 字简历、空 JD、超 1000 字 JD 均返回 400 中文错误；`lint` 和 `build` 通过。
- 边界：未新增依赖，未读取或打印 API Key，未调用真实 DeepSeek，尚未实现固定 prompt、真实模型调用、JSON 修复/重试逻辑。

### RM-0020：DeepSeek 真实分析调用层

- 状态：待后续报告页端到端接入一起合并验收。
- 对应文件：
  - `app/api/analyze/route.ts`
  - `lib/deepseek-client.ts`
  - `lib/analysis-prompt.ts`
- 主要内容：新增 DeepSeek Chat Completion 调用层，读取 `DEEPSEEK_API_KEY`、可选 `DEEPSEEK_MODEL` 和 `DEEPSEEK_API_BASE_URL`；默认模型为 `deepseek-v4-flash`；启用 `response_format: { type: "json_object" }`；JSON parse 或结构校验失败时最多重试一次。
- Prompt 语言规则：分析说明和建议默认中文；英文 JD、岗位名、技能名、工具名、证书名、英文关键词保留原文；`segments.original` 必须严格引用简历原文片段，不翻译、不改写、不润色。
- 验证摘要：缺 key 返回中文配置错误；fake DeepSeek 合法 JSON 返回 `AnalysisReport`；第一次 invalid JSON 第二次合法 JSON 可重试成功；两次结构缺字段返回 500；真实中文和中英混合请求均返回 200；`lint` 和 `build` 通过。
- 边界：未新增依赖；未打印真实 Key；真实联调由项目负责人自行配置本地 `.env.local`，未在聊天或日志中暴露 Key。

### RM-0020-R1：segments.original 原文精确匹配收紧

- 状态：待后续报告页端到端接入一起合并验收。
- 对应文件：
  - `lib/analysis-prompt.ts`
  - `lib/deepseek-client.ts`
  - `lib/segment-original-validator.ts`
- 主要内容：收紧 prompt，要求 `segments.original` 必须逐字复制 `resumeText` 中连续原文，不翻译、不改写、不概括、不补字、不拼接不连续片段；新增 original 匹配校验。
- 处理策略：先严格 `resumeText.includes(segment.original.trim())`；失败后只允许换行/连续空白归一化匹配，不做模糊匹配；首次不匹配触发一次 DeepSeek 重试；第二次仍不匹配则过滤不匹配 segment，保证交给前端的 segments 都可匹配。
- 验证摘要：fake DeepSeek 精确匹配、不匹配、重试和过滤分支均通过；真实中文请求 `ALL_ORIGINALS_MATCH: True`；英文/中英混合请求 `ALL_ORIGINALS_MATCH: True`，关键词保留英文原文；`lint` 和 `build` 通过。
- 风险：如果模型连续两次无法给出可匹配 original，报告高亮片段会减少，但优先保证前端高亮稳定性。

### RM-0020-R2：DeepSeek 非合法 JSON 响应修复

- 状态：待 RM-0021 真实端到端复验后合并 checkpoint。
- 对应文件：
  - `lib/deepseek-client.ts`
  - `lib/analysis-prompt.ts`
- 主要内容：收紧 prompt，明确只输出合法 `JSON / json object`，保留完整 `AnalysisReport` 示例；后端解析支持纯 JSON、code fence JSON、前后夹文字中的 JSON object 提取；完全无效时最多 repair retry 一次。
- 处理策略：`max_tokens` 设置为 `4096`；`finish_reason === "length"` 返回明确截断错误；非 `stop` 异常结束返回简短中文错误，不暴露上游原文；content 为空、JSON parse 失败或 schema 校验失败时只返回摘要并限制重试次数。
- 验证摘要：fake 测试覆盖纯 JSON、code fence JSON、前后夹文字 JSON、`finish_reason=length`、两次 invalid JSON；真实中文请求和中英混合请求均 HTTP 200，字段符合 `AnalysisReport`，英文关键词保留，`segments.original` 全部匹配；`npm run lint` 和 `npm run build` 通过。
- 边界：未修改前端、解析 API、package 依赖；未打印 API Key、完整简历、完整 JD、完整模型原始响应。

### RM-0022：DeepSeek 诊断脱敏与真实 analyze 200 修复

- 状态：主链路已通过，临时诊断日志已清理，待合并 checkpoint。
- 对应文件：
  - `lib/deepseek-client.ts`
  - `lib/analysis-prompt.ts`
- 主要内容：继续收紧结构化输出与解析；请求体确认包含 `response_format: { type: "json_object" }`，保持 `temperature: 0.2` 和 `max_tokens: 4096`；prompt 强约束只输出合法 JSON object，不输出 Markdown、代码块、解释文字或 JSON 前后内容；解析层继续支持 code fence 和前后夹文字 JSON object 提取。
- 诊断策略：移除 raw content 前后 500 字的错误/日志输出；诊断信息只保留 `response_format`、`finish_reason`、`contentLength`、`isEmpty`、`startsLikeJson`、`endsLikeJson`、parse/schema 错误摘要，避免泄露 API Key、完整简历、完整 JD 或完整模型原始响应。
- 验证摘要：`npm run lint` 和 `npm run build` 通过；fake 纯 JSON、code fence JSON、前后夹文字 JSON 均返回 200；fake `finish_reason=length` 返回明确截断 500；fake 两次 invalid JSON 返回脱敏错误摘要；真实中文 `/api/analyze` 和真实中英混合 `/api/analyze` 均返回 200，字段齐全，`segments.original` 全部匹配。
- 风险：RM-0023 已移除临时 `console.info` 诊断日志；真实接口简测在施工窗口未取得可读摘要，但此前真实中文/中英混合 `/api/analyze` 和人工浏览器验收已通过。

### RM-0023：清理 DeepSeek 临时诊断日志

- 状态：已完成，待合并 checkpoint。
- 对应文件：
  - `lib/deepseek-client.ts`
- 主要内容：移除 RM-0022 留下的临时 `console.info` 诊断日志函数和调用点；保留 JSON 解析错误中的安全摘要，包括 content 长度、是否为空、首尾是否像 JSON；不包含 raw content、简历、JD 或模型完整响应。
- 验证摘要：`npm run lint` 和 `npm run build` 通过；fake 纯 JSON、code fence JSON、前后夹文字 JSON 均返回 200；invalid JSON 返回 500，错误摘要无 raw content。
- 边界：未修改 prompt、API 响应结构、前端、解析 API、package 文件；未打印 API Key、完整简历、完整 JD 或完整模型响应。
- 风险：施工窗口真实 analyze 简测未取得可读摘要输出；因本卡只清理日志，主链路以 RM-0021/RM-0022 既有真实 API 与人工浏览器验收为准。

### RM-0021：首页开始分析接入真实报告展示

- 状态：主链路已通过，待合并 checkpoint。
- 对应文件：
  - `app/page.tsx`
  - `app/result/page.tsx`
- 主要内容：首页点击“开始分析”后调用 `POST /api/analyze`，成功后写入 `sessionStorage` 的 `resumatch:last-analysis-report` 并跳转 `/result`；`/result` 优先读取 sessionStorage，缺失时 fallback 到 mock。
- 验证摘要：模拟 `/api/analyze` 成功响应时可进入 loading、跳转 `/result` 并展示 `data-report-source="session"`；刷新 `/result` 可继续读取 sessionStorage；清空 sessionStorage 后 fallback mock 可用；API 失败时首页显示中文错误且不跳转。
- 当前阻塞：RM-0021-R1 复验时，`/`、`/api/parse-resume` 和文本简历解析正常，但真实 `/api/analyze` 仍返回 500：`AI 分析结果结构校验失败：DeepSeek 返回结果不是合法 JSON。` 首页未能写入 sessionStorage，也未能跳转 `/result`。
- 复验补充：`/result` 源码确认优先读取 `sessionStorage` 的 `resumatch:last-analysis-report`，成功时标记 `data-report-source="session"`；空请求失败路径返回 400 中文错误“简历文本不能为空。”，首页代码会显示错误并阻止跳转。
- 本地预览记录：QA 使用 `http://localhost:3001/` 打开页面；Codex 内置浏览器访问 localhost 被客户端拦截，临时下载 Playwright 被安全策略拒绝，真实文件上传 UI 自动化未完成。该 blocker 记录为工具/环境限制，不等同于源码不可打开。
- 当前进展：RM-0022 后端回传确认真实中文和中英混合 `/api/analyze` 已返回 200；下一步需要 QA/测试窗口重新执行首页真实点击、sessionStorage 写入、自动跳转 `/result`、结果页 session 渲染和错误路径复验。
- 人工浏览器验收：项目负责人补充确认页面已成功进入 `/result`，结果页正常展示真实分析报告，包括匹配评分、整体评价、已匹配关键词、缺失关键词和简历分析详情；结合此前真实中文/中英混合 `/api/analyze` 均 200、`lint` 和 `build` 通过，RM-0021 / RM-0022 主链路视为通过。

## 当前风险和边界

- `xlsx` audit 存在 high 风险，当前 no fix available；不要未经确认直接替换或强制修复。
- `next` / `postcss` audit 存在 moderate 风险；当前不要执行 `npm audit fix --force`，避免破坏 Next 版本链路。
- `pdfjs-dist` 要求 Node `>=22.13.0 || >=24`；正式部署前必须确认 Vercel Node 版本和 PDF worker 路径。
- 扫描件 / 图片型 PDF OCR 未做，后续应单独生成任务，不和文字型 PDF 验收混在一起。
- DeepSeek 分析链路主链路已通过且临时诊断日志已清理，但尚未 checkpoint；OCR、Word 导出和 IP 限流仍未接入。
- 不写真实 API Key；DeepSeek 和 OCR Key 只允许通过本地 `.env.local` 或 Vercel Environment Variables 配置。

## 建议下一步

- 下一步建议由总控按轻量流程做 DeepSeek 分析链路 checkpoint；后续施工窗口减少审核型任务，只保留代码改动和最小 `lint` / `build` 自检，产品体验由项目负责人手动确认。
- OCR、Word 导出和 IP 限流仍是后续独立任务，不要混进 DeepSeek 第一张施工卡。
