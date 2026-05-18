# ResuMatch 项目实现记录

> 本文件用于记录已完成 checkpoint、当前待合并验收任务和正式版前风险。它只做进度说明，不替代 `TASKS.md`、`PROJECT_WORKFLOW.md` 或 `PRODUCTION_CHECKLIST.md`。

## 维护规则

1. 本文件由总控室维护。项目负责人只需要把施工窗口和测试验收窗口的回执贴回总控室。
2. 总控室根据回执更新本文件，记录任务编号、完成内容、改动文件、验证结果、风险、是否 checkpoint 和提交 hash。
3. 临时侦察/文档窗口只作为一次性辅助，不作为长期记录负责人。
4. 新总控窗口接管时，应先阅读 `PROJECT_SCOPE.md`、`PROJECT_WORKFLOW.md`、`TASKS.md`、`PRODUCTION_CHECKLIST.md` 和本文件，再判断下一步。
5. 本文件不能替代正式 handoff。总控窗口需要迁移时，仍应给出短 handoff；但本文件应减少 handoff 对旧聊天记忆的依赖。

## 当前状态总览

- 状态：多格式解析链路已完成多张施工卡，尚未统一合并验收和 checkpoint。
- 当前待合并验收范围：`.docx` / `.xlsx` / 文字型 `.pdf` / UTF-8 `.txt` 解析链路，首页多格式上传预览，简历 3000 字限制，JD 1000 字联动。
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

## 当前待合并验收任务

### RM-0014：xlsx 后端解析

- 状态：待合并验收。
- 对应文件：
  - `app/api/parse-resume/route.ts`
  - `lib/parse-xlsx.ts`
  - `package.json`
  - `package-lock.json`
- 主要内容：新增 `.xlsx` 后端文本解析能力，并新增 `xlsx` 依赖。
- 验证摘要：需在统一验收中确认 `.xlsx` 文本提取、接口返回、简历 3000 字限制、`.docx` 回归，以及新增依赖的 audit 风险记录。

### RM-0015：xlsx 前端接入

- 状态：待合并验收。
- 对应文件：
  - `components/FileUploader.tsx`
- 主要内容：首页上传组件支持 `.xlsx` 上传、文本预览和错误提示。
- 验证摘要：需确认 `.xlsx` 上传预览可用，简历 3000 字限制沿用，`.docx` 上传预览无回归。

### RM-0017：文字型 PDF 与 UTF-8 txt 后端解析

- 状态：待合并验收。
- 对应文件：
  - `lib/parse-pdf.ts`
  - `lib/parse-txt.ts`
  - `app/api/parse-resume/route.ts`
  - `package.json`
  - `package-lock.json`
- 主要内容：新增文字型 `.pdf` 和 UTF-8 `.txt` 后端文本解析能力，并新增 `pdfjs-dist` 依赖。
- 验证摘要：需确认文字型 PDF 可提取文本、空白或扫描型 PDF 有清楚错误、UTF-8 txt 可解析、简历 3000 字限制沿用，并检查 Vercel Node 版本兼容风险。

### RM-0018：pdf / txt 前端接入

- 状态：待合并验收。
- 对应文件：
  - `components/FileUploader.tsx`
- 主要内容：首页上传组件支持 `.pdf` / `.txt` 上传预览和错误展示。
- 验证摘要：需确认 `.pdf` / `.txt` 上传预览、空白 PDF 错误、简历 3000 字限制、`.docx` / `.xlsx` 回归，以及 JD 1000 字联动无回归。

## 当前待合并验收范围

- `.docx` / `.xlsx` / 文字型 `.pdf` / UTF-8 `.txt` 解析链路。
- 首页多格式上传预览和错误提示。
- 简历文本 3000 字限制继续沿用。
- JD 1000 字限制继续联动。
- `PROJECT_WORKFLOW.md` 中合并验收 / checkpoint 节奏规则。
- `PRODUCTION_CHECKLIST.md` 中正式版风险记录和 API Key 环境变量规则。

## 当前风险和边界

- `xlsx` audit 存在 high 风险，当前 no fix available；不要未经确认直接替换或强制修复。
- `next` / `postcss` audit 存在 moderate 风险；当前不要执行 `npm audit fix --force`，避免破坏 Next 版本链路。
- `pdfjs-dist` 要求 Node `>=22.13.0 || >=24`；正式部署前必须确认 Vercel Node 版本和 PDF worker 路径。
- 扫描件 / 图片型 PDF OCR 未做，后续应单独生成任务，不和文字型 PDF 验收混在一起。
- 当前不接 DeepSeek，不接 OCR，不做 Word 导出，不做限流。
- 不写真实 API Key；DeepSeek 和 OCR Key 只允许通过本地 `.env.local` 或 Vercel Environment Variables 配置。

## 建议下一步

- 交给测试验收窗口做一次 RM-FILE-A1-C1 或同等范围的统一合并验收。
- 验收重点：git diff 范围、依赖变更原因、真实密钥扫描、`npm run lint`、`npm run build`、多格式上传/解析回归、依赖 audit 风险是否已记录。
- 验收通过后，再由总控室决定是否生成 checkpoint 卡，统一保存 RM-0014 / RM-0015 / RM-0017 / RM-0018 多格式解析链路。
