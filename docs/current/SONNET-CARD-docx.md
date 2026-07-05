# SONNET 卡 · DOCX 导出（独立任务，现在就能做，不等 R2-1 模子）

> 用法同批次 A：开新窗口切 Sonnet，粘下面「复制给 Sonnet」整段。
> 这活和 react-pdf/PDF 模板那摊**完全独立**，可与 Opus 建模子并行跑。

──── 复制给 Sonnet ────

你在 `D:\AI-workspace\projects\ResuMatch` 项目里。任务：把结构化简历导出成 .docx（用项目已装的 `docx@^9.7`）。**只加新文件，不改现有代码。**

**先读**：`lib/resume-structured.ts` —— StructuredResume 形状为 `{ name, headline, contacts[], sections[]{ title, entries[]{ heading, meta, bullets[] } } }`，以它为准。

**产出**：
- `lib/resume-docx.ts`，导出纯函数 `async resumeToDocxBuffer(s: StructuredResume): Promise<Buffer>`（内部用 docx 的 `Document` + `Packer.toBuffer`）。
- 排版结构：姓名（大标题）→ headline（副标题，灰）→ contacts（一行，用 `·` 分隔）→ 每个 section：标题（加粗 + 下边框线）+ 各 entry（heading 加粗、meta 灰色小字、bullets 用项目符号列表）。单栏、clean、ATS 友好。

**约束**：
- **纯逻辑**：输入 StructuredResume、输出 Buffer，无网络、无 UI、无副作用。
- **中文字体**：给文本 run 设一个能正常显示中文的字体，别让 Word 用默认西文字体导致中文回退难看。docx v9 支持按 `ascii`/`eastAsia` 分别设字体（查一下 `IRunOptions` 的 `font` 具体形状再用，别猜）。可用 "Noto Serif SC" 或 "SimSun"。
- 空/缺字段不炸（sections 为空、某 entry 的 bullets 为空、heading/meta 为空串都要正常）。
- docx 的类型从包里 import，别自己造。

**验证（这就是验收）**：
1. 写一个**一次性**脚本（跑完就删）：造一份填满的 StructuredResume（含中文、2~3 个 section、多条 bullets），调 `resumeToDocxBuffer`，写出 `sample.docx` 到 scratchpad 或项目根。
2. 解压该 .docx，确认 `word/document.xml` 里包含预期的中文文本与结构（section 标题、bullets）。
3. 报告：生成无异常、xml 结构正确、**告诉用户 sample.docx 的路径**（最终视觉由用户开 Word 眼验）。

**别做**：不动 `lib/resume-structured.ts`；不碰 react-pdf / PDF 模板；不接 UI；不装新依赖（docx 已在）。

──── 复制结束 ────

## 验收清单（Sonnet 交回，我们逐条勾）
- [ ] `lib/resume-docx.ts` 有 `resumeToDocxBuffer`，`npx tsc --noEmit` 过。
- [ ] sample.docx 生成成功，`word/document.xml` 含中文与正确结构。
- [ ] 用户开 Word 眼验：中文正常、单栏 clean、结构对。
- [ ] `resume-structured.ts` 零改动（`git status` 确认）。
