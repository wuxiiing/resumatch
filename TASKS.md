# ResuMatch Task Plan

> 本任务清单只覆盖交接文件中的第一版范围。任何新增能力都需要先在核心窗口确认。

## 阶段 0：项目地基

目标：确认项目目录、保存项目规则、准备后续开发。

- [x] 建立项目根目录 `D:\AI-workspace\Codex\ResuMatch`。
- [x] 添加项目范围文档 `PROJECT_SCOPE.md`。
- [x] 添加项目协作文档 `PROJECT_WORKFLOW.md`。
- [x] 添加阶段任务清单 `TASKS.md`。
- [x] 明确命名施工窗口和多窗口协作规则。
- [x] 复制交接文件到项目根目录，作为需求源。
- [x] 添加前端设计指南 `FRONTEND_DESIGN_GUIDE.md`，作为阶段 1 页面骨架和视觉风格依据。
- [x] 确认只使用 D 盘目录；C 盘空仓库不再作为开发目录。

## 阶段 1：项目骨架

目标：搭建 Next.js + Tailwind 基础项目，不实现复杂业务。

- [x] 初始化 Next.js App Router 项目。
- [x] 配置 Tailwind CSS。
- [x] 建立 `app`、`components`、`lib`、`types` 基础结构。
- [x] 创建基础首页和报告页骨架。
- [x] 确认可本地启动。

验收标准：本地页面能打开，无业务功能扩展。

## 阶段 1.5：首页体验增强

目标：在前端首页和报告页 checkpoint 后，加入项目负责人明确批准的首页开场动画体验增强，不扩大业务功能范围。

- [x] 整合开场动画为 React / Next.js 可复用组件。
- [x] 保留动画流程：两条竖线水平飞入、中心吸附/碰撞、水平飞出、`RM` 展开、`RESUMATCH` 展开、Logo 上移、主页面内容淡入。
- [x] 去掉残影效果，不重新加入残影。
- [x] 线条飞出只保持水平左右方向，不斜飞。
- [x] 支持 `prefers-reduced-motion`，避免影响减少动态效果的用户。
- [x] 不修改主页业务逻辑，不修改后端/API/解析/DeepSeek/导出/限流。
- [x] 正式版前确认开场动画只在同一浏览器 session 首次进入时自动播放；用户可手动重播。

验收标准：动画自然、克制、可重播，不遮挡用户操作；`npm run lint` 和 `npm run build` 通过。

## 阶段 2：文件解析主链路

目标：先跑通最稳定的简历文本提取。

- [x] 实现 `.docx` 解析。
- [x] 实现简历文本预览。
- [x] 实现 3000 字限制。
- [x] 再实现 `.xlsx` 解析。
- [x] 再实现文字型 `.pdf` 解析。
- [ ] 最后接百度 OCR 兜底。

验收标准：至少 `.docx` 可以稳定提取中文文本并显示预览。

## 阶段 3：JD 输入和提交校验

目标：完成 JD 输入体验和前端提交前校验。

- [x] 创建 JD 输入框。
- [x] 实现 1000 字计数。
- [x] 超限变红并阻止提交。
- [x] 简历和 JD 都满足条件时才能点击开始分析。

验收标准：前端不允许超范围文本进入分析接口。

## 阶段 4：DeepSeek 分析接口

目标：后端调用 DeepSeek 并返回合规 JSON。

- [x] 创建 `/api/analyze`。
- [x] 在后端读取 `DEEPSEEK_API_KEY`。
- [x] 固定 system prompt。
- [x] 拼装 user prompt。
- [x] 调用 DeepSeek chat completions API。
- [x] 校验 JSON。
- [x] JSON 解析失败时重试一次。
- [x] 仍失败时返回 500。
- [x] `PERF-0001-A`：补强输出截断、非 JSON、invalid report 和 annotation 定位失败的工程错误路径与 fake-fetch 验证。
- [x] `PERF-0001-C`：加入脱敏总耗时和分段耗时诊断，不改 prompt、不改返回内容。
- [ ] 优化分析耗时、输出截断和失败提示（`PERF-0001`）。

验收标准：接口能返回符合 `types/analysis.ts` 的结构化数据。

## 阶段 5：报告页渲染

目标：展示匹配度和简历标注报告。

- [x] 创建匹配度仪表盘。
- [x] 展示已匹配关键词。
- [x] 展示缺失关键词和补充建议。
- [x] 展示优化建议数量和摘要信息。
- [x] 按原文定位 annotations / segments 并渲染简历批改视图。
- [x] 根据 `keep` / `improve` / `remove` 和 requirement status 渲染绿色、黄色、红色、灰色语义。
- [x] 找不到原文片段时跳过或进入未定位建议，不报错。
- [x] 黄色优化片段展示问题说明、建议和参考改写。
- [x] `HISTORY-0001`：无 session 报告时优先读取浏览器本地历史；无历史时显示真实空状态，不向普通用户展示 mock 报告。

验收标准：报告只读，不提供网页内编辑能力。

## 阶段 6：IP 次数限制

目标：限制 API 成本和滥用。

- [ ] 实现每 IP 每天 5 次限制。
- [ ] 实现全站每天 500 次限制。
- [ ] 超 IP 限制返回 429。
- [ ] 超全站限制返回 503。
- [ ] 明确使用内存方案还是 Vercel KV。

验收标准：限制逻辑在 `/api/analyze` 前置生效。

当前建议：MVP 先做内存方案，部署前再决定是否换 Vercel KV。首页已经写出每日 IP 次数限制，因此本阶段是 MVP blocker。

## 阶段 7：Word 导出

目标：导出干净 Word 报告。

- [x] 使用 docx.js 生成 Word。
- [x] 第一部分：分析报告摘要。
- [x] 第二部分：简历原文干净版。
- [x] 第三部分：优化建议清单。
- [x] 不在 Word 中加入颜色标注。

验收标准：Word 可打开，内容清楚，适合用户自行修改。

当前状态：`EXPORT-0001` 第一版已实现，`docx` 依赖已安装，存在导出 API 和结果页导出按钮；仍需在真实报告场景做一次用户侧 Word 打开检查。

## 阶段 8：整体联调和部署

目标：完整跑通第一版流程。

- [ ] 上传简历。
- [ ] 粘贴 JD。
- [ ] 分析。
- [ ] 查看报告。
- [x] 导出 Word。
- [ ] 配置 Vercel 环境变量。
- [x] 明确 Vercel Node runtime：`package.json` 使用 `engines.node = "24.x"`，满足 `pdfjs-dist@5.7.284` 的 Node `>=22.13.0 || >=24` 要求。
- [x] 确认 `/api/analyze`、`/api/parse-resume`、`/api/export-word` 都是 `nodejs` runtime。
- [x] 记录生产环境变量清单：必填 `DEEPSEEK_API_KEY`，可选 `DEEPSEEK_MODEL`、`DEEPSEEK_API_BASE_URL`。
- [x] 记录内存限流生产风险：进程重启会清空计数，多实例不共享计数；扩大生产流量前应迁移 Vercel KV。
- [x] 写出部署步骤：本地检查 -> Vercel env vars -> preview deploy -> smoke test -> production deploy。
- [ ] 部署到 Vercel。
- [ ] 用真实样例验收。
- [ ] 正式版前收口示例数据入口、开发提示、发布文案、依赖风险和环境变量检查。

验收标准：主流程完整可用，未加入第一版以外功能。

## 当前 MVP 执行顺序

1. `QA-0001`：补齐 owner-provided 真实 `.docx` 样例和脱敏 JD 的上传 -> 分析 -> `/result` 端到端回归。
2. `MVP-CLEANUP-0001`：正式版前收口剩余开发提示和生产文案。
3. `DEPLOY-0001`：配置 Vercel 环境变量、部署预览并做上线前检查。
4. `AGENT-0001`：第二版 AI agent 架构设计，MVP 不做。

## QA-0001 回归记录

- [x] `npm run lint` 通过。
- [x] `npm run build` 通过。
- [x] 限流脚本通过：同 IP 第 6 次返回 429，全站第 501 次返回 503，且路由顺序为校验后再限流、限流后再调用 DeepSeek。
- [x] Word 导出脚本通过：生成非空 `.docx`，包含报告摘要、干净简历文本和优化建议，响应头为附件下载。
- [x] `/result` 浏览器烟测通过：移动端顺序为岗位方向、关键词分析、正文批改；历史记录可选中、删除、清空；导出 API 返回非空 Word 响应。
- [x] 真实 PDF 样例解析 API 烟测通过：`/api/parse-resume` 返回 `pdf`，且提取文本存在。
- [x] `MVP-CLEANUP-0001` 文案收口：结果页无 session 时保持真实空状态；历史记录提示本地保存和清理不可恢复；导出 Word 不再呈现未完成状态；主页开场动画同一浏览器 session 内不反复自动播放。
- [ ] 真实 `.docx` 样例上传 -> `/result` 端到端回归：当前未找到可用真实 `.docx` 样例，需 owner 提供或指定路径。
- [ ] 真实 DeepSeek 分析回归：需真实 `.docx` 样例和脱敏 JD 后再跑，避免打印完整简历/JD/模型原始响应。
- [ ] 内置浏览器真实下载/打开 Word：本轮验证到导出 API 响应，未完成浏览器下载文件落地和 Word 打开检查。

发现问题：

- 当前仓库和邻近搜索路径未发现真实 `.docx` 样例，导致 QA-0001 核心验收未闭环。
- 本地 dev server 后台启动在当前 Windows 环境下不稳定，`Start-Process` 遇到 `Path/PATH` 冲突；可用 PowerShell job 做短时验证，但不适合作为长期预览方式。

## 当前待确认问题

- [x] 是否正式只使用 `D:\AI-workspace\Codex\ResuMatch` 作为项目目录。已确认。
- [x] C 盘 `C:\Users\Administrator\Documents\简历颗粒度对齐网站` 是否废弃、保留，还是迁移 Git。已确认不作为开发目录。
- [x] 第一版限流使用内存方案还是 Vercel KV。当前建议：MVP 先用内存方案，部署前再决定是否换 Vercel KV。
- [x] 百度 OCR 是否第一阶段就接入，还是等 PDF 主流程跑通后再接。当前建议：MVP 先不接 OCR，文字型 PDF 已可继续推进；扫描件/图片型 PDF 后续单独做。
- [ ] 是否已有 DeepSeek API Key，并且本地 `.env.local` / Vercel 环境变量是否已由项目负责人配置。
- [ ] 是否已有百度 OCR API Key。MVP 暂不阻塞。

