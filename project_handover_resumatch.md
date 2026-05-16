# 项目交接文件 · ResuMatch 简历-岗位匹配分析系统

> 本文件由Claude生成，交由Codex执行。所有技术决策已确认，按本文件实现即可，不要自行扩展功能范围。

---

## 一、项目概述

**产品名称：** ResuMatch（暂定）

**一句话定义：** 用户上传简历 + 粘贴岗位JD，系统分析匹配度，输出像"查重报告"一样的可视化标注报告，最终导出Word文档供用户参考修改。

**核心价值：** 不是替用户写简历，而是当"教练"——告诉用户哪里跟JD有关、哪里无关、哪里改一下会更好，给出例子，让用户自己动手改。减少AI味，保留用户自己的表达风格。

**目标用户：** 中文求职者，以应届生为主。

**语言：** 全中文界面，全中文输出。

---

## 二、技术栈

| 层级 | 技术选择 |
|------|----------|
| 前端框架 | Next.js (App Router) |
| 样式 | Tailwind CSS |
| 后端 | Vercel Functions（同一个Next.js项目） |
| AI分析 | DeepSeek API（deepseek-chat模型） |
| PDF解析 | pdf.js（主力） + 百度智能云OCR（降级兜底） |
| Word/Excel解析 | mammoth.js（Word） + xlsx.js（Excel） |
| Word导出 | docx.js |
| 部署 | Vercel |

---

## 三、功能范围（第一版，严格限制）

### 做的

- 文件上传：支持 .pdf / .docx / .xlsx
- JD输入：纯文本粘贴框，字数限制1000字
- DeepSeek分析：返回结构化JSON
- 分析报告页：颜色标注 + 匹配度评分 + 修改建议
- Word导出：干净纯文字版本 + 修改建议附录
- 次数限制：基于IP，每个IP每天5次；全站每日硬上限500次
- 简历字数限制：提取文字后超过3000字提示用户精简，拒绝提交

### 不做（第一版不碰）

- 用户注册/登录系统
- PDF生成（只导出Word）
- 网页内直接编辑简历文字
- 多语言支持
- 付费系统
- 一键修改功能

---

## 四、页面结构

### 页面1：首页 / 上传页

布局：左右两栏

**左栏：简历上传区**
- 拖拽或点击上传，支持 .pdf / .docx / .xlsx
- 上传后显示文件名和"解析中..."状态
- 解析完成后在左栏下方显示提取出的纯文本预览（只读，灰色背景，用户确认文字是否正确）
- 如果解析失败（PDF图片型），显示提示："您的PDF无法自动识别，正在尝试备用方案..."，走百度OCR；如果OCR也失败，提示"建议上传Word格式以获得最佳效果"

**右栏：JD输入区**
- 纯文本textarea，placeholder："请将目标岗位的职位描述粘贴到这里"
- 字数计数显示，超1000字变红并阻止提交
- 下方有一个醒目的"开始分析"按钮

**顶部：**
- 简单的使用说明折叠区，说明颜色含义：
  - 🟢 绿色：与JD高度相关，保留
  - 🟡 黄色：可以优化，有建议
  - 🔴 红色/灰色：与JD关联度低，考虑删减或调整
  - 数字评分：匹配度百分比

### 页面2：分析报告页

**顶部区域：匹配度仪表盘**
- 大字显示匹配度分数，例如 "匹配度：72%"
- 下方三个小卡片：
  - 已匹配关键词（绿色列表）
  - 缺失关键词（红色列表）
  - 建议优化项数量

**主体区域：简历标注报告**
- 将提取的简历文字渲染成HTML富文本
- 每个句子或段落根据DeepSeek返回的JSON，渲染对应背景色
- 每个黄色（可优化）段落下方展开显示：
  - 问题说明（一句话）
  - 修改建议例子（用浅色框包裹）
- 注意：这里是只读展示，用户不能在这里直接编辑

**底部操作区：**
- "导出Word报告"按钮
- 小字提示："本报告为AI辅助分析，仅供参考，建议结合自身实际情况判断"

---

## 五、核心数据流

```
用户上传文件
    ↓
前端解析文件（pdf.js / mammoth / xlsx）
    → 失败 → 走百度OCR API
    → 还是失败 → 提示用户换格式
    ↓
提取纯文字，字数检查（>3000字拒绝）
    ↓
用户填入JD（字数检查 >1000字拒绝）
    ↓
前端调用 /api/analyze（Vercel Function）
    ↓
后端检查IP次数限制（redis或简单内存方案）
    → 超限 → 返回429，提示"今日分析次数已用完"
    ↓
后端拼装Prompt，调用DeepSeek API
    ↓
DeepSeek返回结构化JSON
    ↓
后端验证JSON格式，返回前端
    ↓
前端渲染标注报告页
    ↓
用户点击导出 → 前端用docx.js生成Word文件并下载
```

---

## 六、DeepSeek API调用规范

### 模型
使用 `deepseek-chat`

### System Prompt（后端固定，不暴露给用户）

```
你是一个专业的简历优化顾问。你的任务是分析用户简历与目标岗位JD的匹配程度。

规则：
1. 不要重写用户的简历原文，保留用户自己的表达风格
2. 只做标注和建议，不做替换
3. 给建议时提供1-2个具体例子，但要保留用户语气
4. 输出必须是严格的JSON格式，不要输出任何其他文字

输出JSON结构如下：
{
  "match_score": 数字（0-100），
  "matched_keywords": ["关键词1", "关键词2"],
  "missing_keywords": ["关键词1", "关键词2"],
  "segments": [
    {
      "original": "简历中的原文片段（完整复制，不要修改）",
      "status": "relevant" | "optimize" | "irrelevant",
      "comment": "简短说明（status为relevant时可为空字符串）",
      "suggestion": "具体修改建议和例子（status为optimize时必填，其他可为空）"
    }
  ],
  "summary": "整体评语，2-3句话，中文，客观中肯"
}

status说明：
- relevant：与JD高度相关，建议保留
- optimize：内容有价值但表达可优化，或缺少JD关键词
- irrelevant：与目标岗位关联度低

注意：segments中的original字段必须是简历原文的精确片段，用于前端匹配高亮，不要改动原文哪怕一个字。
```

### User Prompt模板（后端拼装）

```
【目标岗位JD】
{jd_text}

【用户简历】
{resume_text}

请按照规定格式输出JSON分析结果。
```

### 返回处理
- 后端接收到DeepSeek返回后，验证JSON是否合法
- 如果JSON解析失败，重试一次
- 重试仍失败，返回500给前端，前端显示"分析失败，请重试"

---

## 七、前端标注渲染逻辑

DeepSeek返回的JSON中，segments里每个对象有original字段（原文片段）。

前端渲染逻辑：
1. 将简历全文按segments的original字段，逐个匹配定位（字符串匹配）
2. 按status给对应文字片段包上span，附加对应CSS class：
   - `relevant` → 绿色背景
   - `optimize` → 黄色背景，点击展开comment和suggestion
   - `irrelevant` → 灰色背景
3. 未被任何segment覆盖的文字，保持原样显示

注意边界情况：如果某个original在全文中找不到（匹配失败），跳过该segment，不报错。

---

## 八、Word导出格式

使用docx.js生成。

结构：

```
第一页：分析报告摘要
  - 标题："简历匹配分析报告"
  - 匹配度：XX%
  - 匹配关键词：...
  - 缺失关键词：...
  - 整体评语：...

第二页：简历原文（干净版，无颜色标注）

第三页：优化建议清单
  - 逐条列出所有status为optimize的segment
  - 格式：
    原文：...
    问题：...
    建议：...
```

不要在Word里做颜色标注，保持Word文件干净，方便用户直接在上面修改。

---

## 九、IP次数限制实现

使用Vercel KV（免费套餐）或者简单的内存方案（重启清零，MVP可接受）。

逻辑：
```
key: `ip_count_${ip}_${today_date}`
value: 使用次数
TTL: 24小时

每次请求：
1. 读取当前count
2. 如果count >= 5，返回429
3. 否则count+1，继续处理

全站每日上限：
key: `global_count_${today_date}`
value: 全站总次数
如果 >= 500，返回503，提示"今日服务请求已达上限，请明日再试"
```

---

## 十、环境变量

项目需要以下环境变量，配置在Vercel项目设置里：

```
DEEPSEEK_API_KEY=你的DeepSeek API Key
BAIDU_OCR_API_KEY=百度智能云 API Key
BAIDU_OCR_SECRET_KEY=百度智能云 Secret Key
```

前端代码不得直接使用这些Key，必须通过Vercel Function中转。

---

## 十一、UI风格备注

UI设计由项目负责人（麦桐）后期统一处理，Codex实现功能时：
- 使用Tailwind基础样式即可，不要做复杂的自定义设计
- 保持结构清晰，组件边界清楚，方便后期替换样式
- 颜色用Tailwind默认色板临时替代：green-100、yellow-100、gray-100
- 字体不做特殊处理

---

## 十二、项目目录结构建议

```
/app
  /page.tsx              首页（上传+JD输入）
  /result/page.tsx       分析报告页
  /api
    /analyze/route.ts    核心API：调用DeepSeek
    /ocr/route.ts        百度OCR降级接口
/components
  /FileUploader.tsx      文件上传+解析组件
  /JDInput.tsx           JD文本框组件
  /ReportViewer.tsx      标注报告渲染组件
  /ScoreDashboard.tsx    匹配度仪表盘组件
/lib
  /parseFile.ts          pdf.js + mammoth + xlsx解析逻辑
  /exportWord.ts         docx.js导出逻辑
  /rateLimit.ts          IP次数限制逻辑
/types
  /analysis.ts           TypeScript类型定义（JSON结构）
```

---

## 十三、开发顺序建议

1. 搭项目骨架（Next.js + Tailwind + 目录结构）
2. 实现文件解析（mammoth Word解析先跑通，再加pdf.js，最后加百度OCR）
3. 实现DeepSeek API调用，跑通JSON返回
4. 实现前端标注渲染
5. 实现IP限制
6. 实现Word导出
7. 联调整体流程
8. 部署Vercel

---

## 十四、不要做的事情（重要）

- 不要做用户注册/登录
- 不要做PDF导出（只做Word）
- 不要做网页内简历直接编辑
- 不要做付费系统
- 不要做多语言
- 不要自行扩展功能，有疑问先问项目负责人
- Word导出不要加颜色标注，保持干净

---

*文件生成时间：2026年5月*
*项目负责人：麦桐*
*执行方：Codex*
