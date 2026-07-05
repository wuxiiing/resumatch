# 简历模板系统(R2)· 参考与开发目录

> 见 `docs/current/V2-PRODUCT-PLAN.md` §R2。内部数据模型 = `lib/resume-structured.ts` 的 `StructuredResume`;导出映射目标 = JSON Resume v1 schema。

## 4 套正式模板(只做 4 套,做到极致)
- `ats-classic/` — 黑白保守,ATS 友好,HR 最稳
- `apple/` — 大量留白,极简,Helvetica 气质
- `notion/` — 浅灰、圆角、现代,适合互联网
- `ai-pro/` — **独家**:第 2 页放研判摘要(Why Match / Best Fit / Gap),把研判数据变成简历附件

## `inspirations/` — 参考攒这里,不临时找
- Reactive Resume(开源,GitHub 直接读源码):研究其 Resume→Page→Section→Item 组件拆分与打印样式
- jsonresume.org themes:几十套 theme,json→html→pdf 的管线参考
- 看到好模板:先截图丢进来,攒 30+ 再动手

## 编辑形态(定了)
对话式/填空式编辑 + 右侧实时预览窗(editor|preview 双栏,Reactive Resume 模式)。
