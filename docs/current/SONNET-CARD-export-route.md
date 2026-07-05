# SONNET 卡 · 简历导出 route（让简历在浏览器能看/能下载）

> 独立任务，和 Opus 的页面 UI 并行。Sonnet 做完自己起 dev server 自验；之后 Opus 在浏览器复验并给用户看。

──── 复制给 Sonnet ────

你在 `D:\AI-workspace\projects\ResuMatch`。任务：建一个导出 route，把结构化简历渲成 PDF/DOCX 返回。**只加这一个 route 文件（必要时改 next.config 一行），别动别的。**

**已有可用件（直接 import，别重写）**：
- `@/lib/pdf/templates/ats-classic.ts` 的 `AtsClassicDocument(resume): ReactElement` —— 配 `renderToBuffer`（来自 `@react-pdf/renderer`）出 PDF Buffer。
- `@/lib/resume-docx.ts` 的 `resumeToDocxBuffer(resume): Promise<Buffer>` —— 出 DOCX Buffer。
- 类型 `@/lib/resume-structured.ts` 的 `StructuredResume`。

**建 `app/api/export-resume/route.ts`**：
- **必须** `export const runtime = "nodejs";`（react-pdf / docx 要 node 运行时，不能 edge）。
- `GET`：用一个**内置样例** StructuredResume 渲染，默认返回 **PDF 且 `Content-Disposition: inline`**（这样浏览器打开 URL 直接看到简历）；`?format=docx` 返回 docx（attachment）。样例放个填满的、含中文、能到两页的（可参考 `docs/current/SONNET-CARD-docx.md` 里描述的形状造）。
- `POST`：body = `{ format?: "pdf" | "docx", resume: StructuredResume }`，返回对应文件、`attachment`。这是将来页面 UI 调的。
- DOCX 的 MIME：`application/vnd.openxmlformats-officedocument.wordprocessingml.document`。
- 文件名含中文 → 用 `Content-Disposition: attachment; filename*=UTF-8''${encodeURIComponent(name)}.pdf`（别用裸 `filename=`，中文会乱）。
- Buffer 包进 `Response`：`new Response(new Uint8Array(buf), { headers })`。
- 错误处理照项目现有 route（瞄一眼 `app/api/intake-text/route.ts` 之类）的风格：try/catch，出错返 500 + JSON。

**已知坑**：若 dev/build 报 react-pdf 相关打包错（fontkit / canvas 之类），在 `next.config`（.ts 或 .mjs）里加 `serverExternalPackages: ["@react-pdf/renderer"]`（Next 15 字段名），再试。

**验证（这就是验收）**：
1. `npm run dev` 起服务。
2. 浏览器或 curl 开 `http://localhost:3000/api/export-resume` → 一份**正常的两页中文 PDF**（不报错、不乱码、无连字符）。`curl ... -o out.pdf` 后确认文件头是 `%PDF`。
3. `http://localhost:3000/api/export-resume?format=docx` → 下到一个能打开的 .docx。
4. POST 一个 `{ resume, format }` 样例 → 拿到对应文件。
5. 报告结果；**dev server 留着别关**（方便 Opus 接手在浏览器复验、给用户看）。

**别做**：不建页面 UI（那是 Opus 的活）；不改简历模板 / docx 生成逻辑；不动别的 route。

──── 复制结束 ────

## 验收清单（Sonnet 交回，我们勾）
- [ ] `app/api/export-resume/route.ts`，`runtime="nodejs"`，GET（样例预览 inline PDF）+ POST（真数据下载）。
- [ ] 浏览器开 GET 看到正常两页中文 PDF；`?format=docx` 下到可开的 docx。
- [ ] `npx tsc --noEmit` 过；没动模板 / docx 逻辑与别的 route。
- [ ] （若加了）next.config 只多 `serverExternalPackages` 一行。
