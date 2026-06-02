# ResuMatch

ResuMatch 是一个中文简历与岗位描述匹配分析工具。用户上传简历并填写目标岗位描述后，系统会解析简历文本，调用 DeepSeek 生成结构化匹配报告，并在结果页展示岗位匹配度、关键词覆盖、简历问题定位和改进建议。

当前版本定位为 MVP，核心流程已经部署到 Vercel 并完成了人工可用性检查。MVP 收尾后，项目会先进入 Agent 教学与实验支线，再考虑完整的 Agent 版本重构。

## 在线状态

- 部署平台：Vercel
- 当前阶段：MVP 已部署，可用于基础体验和小流量验证
- 生产环境变量：`DEEPSEEK_API_KEY`
- 可选环境变量：`DEEPSEEK_MODEL`、`DEEPSEEK_API_BASE_URL`

## 核心功能

- 上传简历文件并提取正文
- 输入目标岗位描述或招聘 JD
- 调用 DeepSeek 生成匹配分析
- 展示整体匹配判断、关键词覆盖和改进建议
- 在结果页查看简历片段级标注
- 导出干净版 Word 分析报告
- 在当前浏览器保存本地历史记录
- 对分析接口进行基础限流，降低误用风险

## 支持的简历格式

- `.docx`
- `.xlsx`
- 文本型 `.pdf`
- UTF-8 `.txt`

## 已知限制

- PDF 解析仍是当前最主要的不稳定点。文本型 PDF 已做支持，但不同 PDF 的内部文本结构差异很大，可能出现换行、顺序或内容提取异常。
- 扫描件、图片型 PDF 和 OCR 识别不在 MVP 范围内。
- 匹配分数由大模型生成，同一输入在多次运行时可能存在轻微波动。
- 历史记录仅保存在当前浏览器本地，不支持账号、云同步或跨设备恢复。
- 当前限流使用进程内内存计数，适合 MVP 小流量验证；多实例生产流量需要迁移到持久化存储，例如 Vercel KV。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- DeepSeek Chat Completions API
- Vercel

## 本地运行

安装依赖：

```bash
npm install
```

创建本地环境变量文件：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
```

启动开发服务器：

```bash
npm run dev
```

打开：

```bash
http://localhost:3000
```

## 常用命令

```bash
npm run lint
npm run build
```

## 主要项目结构

```text
app/
  page.tsx                    # 首页上传和分析入口
  result/page.tsx             # 分析结果页
  api/analyze/route.ts        # DeepSeek 分析接口
  api/parse-resume/route.ts   # 简历解析接口
  api/export-word/route.ts    # Word 导出接口
lib/
  deepseek-client.ts          # DeepSeek 请求、解析和校验
  analysis-prompt.ts          # 分析提示词
  analysis-schema.ts          # 报告结构校验
  segment-original-validator.ts
types/
  analysis.ts                 # 分析报告类型
```

## MVP 范围说明

当前 MVP 重点验证的是：

- 用户能否上传简历并输入岗位描述
- 系统能否生成可读、可行动的匹配分析
- 结果页能否清楚展示简历中的优势、缺口和改进方向
- Word 导出能否提供一个可交付的干净报告

暂不包含：

- 登录或注册
- 会员、订阅或支付
- 网页内直接编辑简历
- 一键改写完整简历
- PDF 导出
- 多语言切换
- OCR 扫描件识别

## 版本路线

- `1.0 MVP`：当前已部署版本，验证简历解析、岗位匹配分析、结果页展示和 Word 导出等核心闭环。
- `1.5 Agent 教学/实验版`：用于学习和验证 Agent 基础概念，例如工具调用、自主判断、反思、自检和小规模工具编排。这个阶段可以保留本地实验文件或单独支线，不要求进入正式产品链路。
- `2.0 完整 Agent 版`：在完成 Agent 学习与实验后，再设计真正的产品级 Agent 架构。

## 下一阶段方向

后续重点会从单次固定分析 pipeline，转向更像真实 Agent 的工作流：

- 让系统自主判断 JD 信息是否足够
- 让 Agent 决定是否需要追问、补充分析或调用工具
- 引入更明确的工具层，例如 JD 分析、简历证据提取、岗位市场信息检索、评分校准和报告生成
- 保留结构化输出校验、工具白名单、超时预算和 fallback 机制，避免 Agent 输出不可控

## 安全说明

- 不要提交 `.env.local`
- 不要把真实 API Key 写进代码、README、Issue、PR 或聊天记录
- DeepSeek API Key 应只通过本地环境变量或 Vercel Environment Variables 配置
- 不要提交完整真实简历、完整 JD 或完整模型原始响应

## 项目状态

MVP 已经可用，PDF 解析仍作为已知限制记录。下一步建议不再继续打磨 MVP 细节，而是进入 Agent 版本设计与实验。
