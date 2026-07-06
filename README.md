# 简配 · ResuMatch

> **求职军师**，不是简历打分器。看穿 JD、研判值不值得打、告诉你怎么打。

把简历和目标岗位丢进来，军师逐层过卷——先解读 JD 真身、再提取简历证据、然后立体匹配给裁决（目标/跳板/该绕开），最后出具体的简历改写策略 + 面试考点拆解 + 谈薪话术。聊完还能改简历、选模板、导出专业 PDF/Word。

## 在线地址

部署在 Vercel，push main 自动部署。

## 核心功能

### 研判（主流程）
- **竹林输入页**：视频背景 + 玻璃对话框，支持文字/文件/截图入场，豆包视觉 OCR 图片简历
- **JD 真身解读**：看穿岗位到底要什么人，识别潜台词、信号词、信息缺口
- **简历证据提取**：从简历里翻牌，不评判，只列证据
- **立体匹配研判**：信号 → 后端规则定级（目标/跳板/该绕开），不靠模型拍板；附带取舍分析、避雷警告、条件分叉
- **应对策略**：简历扬长避短 + 面试要点 + 面试考点比重拆解（权重% + JD 依据）+ 谈薪策略

### 职业规划
- **小简聊天**：扎根简历和意愿的多轮对话，做方向校准和专业→岗位推荐
- **知识库增强**：40+ 专业的岗位对照数据 + 求职方法论语料，对话时自动检索注入
- **路径推演**：点一下推演 2-3 条职业路径，每条 2-3 步，标 feasibility + 简历依据 + 差距

### 简历工作台
- **结构化编辑**：LLM 智能整理简历 + 填空式/对话式编辑
- **模板系统**：4 套 PDF 模板（ATS 保守 / Apple 极简 / Notion 圆角 / AI-Pro 研判版）+ DOCX 导出
- **双栏实时预览**：左编辑右预览，改一个字右边立刻变
- **照片支持**：上传头像，3 套模板自动渲染

### 辅助工具
- **军师对话**：扎根研判报告的多轮追问，不是客服是顾问
- **公司背调**：Tavily 联网搜 + DeepSeek 综合，只依据公开信息
- **岗位真实性检测**：搜招聘帖发布时长/重复度信号，识别幽灵岗
- **本地历史**：浏览器本地存档，可重命名、可删除

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js App Router + React + TypeScript |
| 样式 | Tailwind CSS + 新国风设计系统（宣纸/竹青/朱印/节节高） |
| AI 脑 | DeepSeek（研判/对话/规划/背调） |
| AI 眼 | 豆包 Seed Vision（图片简历 OCR + 结构化） |
| 搜索 | Tavily（背调 + 岗位真实性） |
| 工作流 | LangGraph JS（①②③④ 串行研判管道） |
| PDF | @react-pdf/renderer（4 套模板 + 字体子集化） |
| DOCX | docx 库 |
| 简历解析 | pdfjs-dist + mammoth + xlsx |
| 部署 | Vercel（Node.js runtime） |

## 本地运行

```bash
npm install
npm run dev        # → http://localhost:3000
```

## 环境变量

创建 `.env.local`（不提交）：

```bash
# 必填
DEEPSEEK_API_KEY=sk-xxx          # 研判/对话/规划的「脑」
ARK_API_KEY=xxx                  # 豆包视觉，图片简历 OCR
TAVILY_API_KEY=tvly-xxx          # 联网搜，背调+岗位调查

# 可选（有默认值）
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
ARK_VISION_MODEL=doubao-seed-1-6-vision-250815
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

本地测试时可设 `RATE_LIMIT_BYPASS=1` 跳过限额检查。**生产环境不要设。**

## 部署

1. 把 3 个必填 key 配到 Vercel Environment Variables
2. `engines.node` 设为 `24.x`（`pdfjs-dist` 要求）
3. `npm run build` 本地验证通过 → push main → Vercel 自动部署
4. 多实例上线前把 `lib/rate-limit.ts` 的内存计数换 Vercel KV

## 主要项目结构

```text
app/
  agent/page.tsx               # 竹林输入页（视频+玻璃对话框）
  agent-result/page.tsx        # 研判报告页（国风·决策优先）
  career/page.tsx              # 小简 · 职业规划
  profile/page.tsx             # 我的简历（长期档案）
  resume/page.tsx              # 简历工作台（editor|preview 双栏）
  api/
    agent-analyze/route.ts     # 主研判管道 ①②③④
    agent-chat/route.ts        # 军师对话
    career/route.ts            # 方向校准
    career-chat/route.ts       # 小简对话
    career-path/route.ts       # 职业路径推演
    parse-resume/route.ts      # 简历文件解析
    extract-image/route.ts     # 豆包视觉 OCR
    intake-text/route.ts       # 文字分诊
    resume-structure/route.ts  # LLM 结构化整理
    export-resume-template/    # PDF/DOCX 模板导出
    job-recon/route.ts         # 岗位真实性调查
    company-recon/route.ts     # 公司背调
lib/
  agents/                      # Agent 节点（jd-analysis/resume-evidence/match-judge/action-plan/career-fit/career-path）
  pdf/templates/               # 4 套 PDF 模板（ats-classic/apple/notion/ai-pro）
  knowledge-index.ts           # 知识库内存索引（40+ 专业岗位对照 + 方法论）
  api-helpers.ts               # Route 样板 helper
  rate-limit.ts                # IP 限额（内存版）
  history.ts                   # 本地研判历史
  agent-report.ts              # 前端共享数据契约
  resume-structured.ts         # 结构化简历模型
  resume-jsonresume.ts         # JSON Resume 导入/导出
  resume-docx.ts               # DOCX 导出
knowledge/                     # RAG 语料（3 个 MD 文件）
scripts/                       # 测试脚本
```

## 产品原则

- **不装作知道**：推断必须带概率 + 证据，公司/业务线推断标注"非确定"
- **判级由规则定**：tier 由后端信号→规则出，不让模型拍板
- **不编造**：一切扎根简历和 JD 原文，有证据才说
- **不画时间饼**：不给"30天/3个月"这种周期，只做定性判断
- **极简克制**：新国风设计系统，一点红原则，Moonshot 向

## 明确不做

- 用户注册/登录
- 一键改写/一键生成简历
- 多语言
- 付费系统

---

## 作者

**麦桐** — AI 产品经理，独立全栈开发。

- 反馈建议：462380155@qq.com
- GitHub：[github.com/wuxiiing/resumatch](https://github.com/wuxiiing/resumatch)

## 许可

MIT License。代码开源，欢迎 Fork / PR / 提 Issue。「简配 · 求职军师」产品概念与设计 © 麦桐，保留所有权利。
