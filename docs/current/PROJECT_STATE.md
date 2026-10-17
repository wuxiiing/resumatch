# ResuMatch Current State

> **最新（2026-10-17）· 模型回归修复 + 判级评测集 + 背调必做**：DeepSeek 2026-09-10 把 `deepseek-v4-flash` 转到默认开深度思考的 V4.1 Flash（思考吃满 max_tokens、temperature 失效），③判级基本跑不通（基线跑通率 7.8%）。修复：`deepseek.ts` 显式关思考 + 模型名改 `deepseek-flash`（`b0a529a`）。新增判级评测 `scripts/eval-verdict.mts`（30 道真实 JD × 3 次自动阅卷，人工标注答案放仓库外私有目录），据此又改了：`decideVerdict` 改为"踩雷或方向冲突 → 该绕开"（原来该绕开召回为 0；**交接文档里"判级规则不许动"的铁律，经用户同意按评测证据更新**）；③踩雷只看岗位底色（①的真身）、须引 JD 原文，资格不进判级；④口径跟 tier 走；新增 ⑤背调节点（①之后搜一次 Tavily + 一次模型，报告里显示"是不是坑"，只给③参考、不改定档；评测时用 `RECON_CACHE_DIR` 缓存搜索结果）；两个聊天加"深度思考"开关（默认关），两个深查背调路由关思考。最新成绩（含背调）：准确率 94.4%（瞎猜基线 66.7%）、pass^3 90.0%、一致性 93.3%、Macro-F1 0.88、P95 48.8s。已知：C13（补贴策略 PM）3 次全判该绕开，标注是跳板，待用户定口径。
> **最新（2026-07-05）· P0 上线前收口 done**：导出限流(仅下载 `download:true` 计入 `edit` 5/天,实时预览不限)+ 删旧 export 死路由/lib(全仓零引用)+ 新增 `PRODUCTION_CHECKLIST.md`(实核 env)。R1+R2+P0 全部 WIP 已本地存档分支 `save/r1-r2-wip-20260705`(**未 push**)。下一步:P1 人工验证(用户跑)、P2 端到端。
> **（2026-07-04）**：R1(竹林+侦探)+ R2(简历模板系统)均已完成。**新窗口先读 [HANDOFF-R2-DONE.md](HANDOFF-R2-DONE.md)**(收尾清单/上线前收口/R3 下一步/风险与红线),再看 `V2-PRODUCT-PLAN.md`。上一程交接 `HANDOFF-2026-07-04.md` 仍可参考。
> **2.0 进行中（2026-06-28）**：简配 2.0「求职军师」功能基本齐 + 设计统一升级一轮 + 简历修改重做。
> 新窗口先读 [HANDOFF-2026-06-28.md](HANDOFF-2026-06-28.md)（最新交接：journey / 关键决策 / 怎么跑 / 下一步 / 坑）+ 根目录 `PRODUCT.md`。
> 下面这份是已部署 **MVP** 的状态（不动 MVP）。

Last updated: 2026-06-24（MVP）

## Project Snapshot

- Path: `D:\AI-workspace\projects\ResuMatch` (the old `Codex` workspace folder was renamed to `projects`; older docs may still say `Codex`).
- App: Next.js App Router + React + TypeScript + Tailwind CSS, analysis by DeepSeek Chat Completions.
- Current observed branch: `main...origin/main [ahead 1]` (a real `origin` remote exists; MVP is deployed on Vercel).
- Latest checkpoint: `2724826 checkpoint: finalize MVP README` (2026-06-03). No product commits since then; the repo has been idle while the owner worked elsewhere.
- Untracked, preserve unless the owner opens a cleanup window:
  - `.rescue-backups/` - local rescue backups.
  - `learning-1.5/` - the v1.5 Agent learning lab (local experiments, intentionally not committed; see Current Focus).
  - `tsconfig.tsbuildinfo` - TypeScript incremental build cache, now added to `.gitignore`.

## Current Product Status (MVP - deployed)

- The MVP core loop is complete and **deployed to Vercel**, with an owner usability check passed (see `README.md`).
- Multi-format resume parsing: `.docx`, `.xlsx`, text-based `.pdf`, UTF-8 `.txt`.
- DeepSeek analysis main flow with retry, JSON parsing, and report validation.
- Result page: overall match judgement, keyword coverage, and inline resume segment-level annotations.
- Word export (`EXPORT-0001`): in-memory clean `.docx` report (summary, job direction, JD coverage, clean resume text, improvement annotations).
- Local report history: browser-local only, no login / database / cross-device sync (intentional).
- Rate limit (`LIMIT-0001`): in-memory, 5 analyses per IP per Beijing day and 500 per site per Beijing day (MVP-only; needs Vercel KV for multi-instance).
- Analysis engine hardening (`ENGINE-0003`): prompt slimdown, junior-level calibration, and output hardening. Engine spec is at `docs/current/ANALYSIS_ENGINE_SPEC.md`.
- Latency diagnostics (`PERF-0001-C`) implemented without prompt changes.
- Vercel deploy fixes landed: pdfjs parses without a worker, pdfjs runtime files / server assets included, deployed analysis flow stabilized.

## Current Focus - 2.0 multi-node agent rebuild (in progress, 2026-06-24)

Direction + architecture locked in `docs/current/V2-SPEC-0001.md` (v0.2). Summary:

- **Product**: not a resume scorer — a "10-year HR + job-hunt strategist". Core value = **deep JD interpretation** (see-through, not literal); scoring downgraded to a support signal.
- **Architecture**: split the old single-call "8-in-1" prompt into a **LangGraph (JS) multi-node workflow**, running inside the existing Next.js/Vercel monolith (no Python, no separate service). Rebuild = "swap skeleton, transplant organs": keep existing anti-hallucination / verbatim-locate / backend-scoring / validation assets (do NOT touch the old `lib/deepseek-client.ts` analyze chain yet).
- **Third input = user intent** (target direction + hard-no), mixed collection (tiny profile + in-chat follow-up). This is what makes ③④ per-user — "understand the user", not just JD+resume.

Built + verified today (`lib/agents/`, run via `node --experimental-strip-types --env-file=.env.local scripts/try-pipeline.mts`):

- ✅ ① JD analysis node — sees through the JD (真身 / who they want / signals / info gaps), with a stance.
- ✅ ② resume evidence node — extracts the candidate's "cards", no judgement.
- ✅ ③ match-judge node — 立体 per-user judgment: backend-ruled tier (目标/跳板/该绕开) + isBoundary, plus model-emitted **fork** (条件分叉: gives two branches when the verdict hinges on an undecided user choice), **warnings** (避雷: risks sniffed from JD text), **timeHint** (时限/退出提醒). Tier stays stable via signals→backend rule; the extra dimensions don't affect the tier.
- ✅ ④ action-plan node — resume highlight/downplay + interview tips + salary strategy.
- LangGraph chains ①→②→③→④ (serial). langgraphjs runs fine under Node 24 strip-types.
- All 4 nodes use a shared `lib/agents/deepseek.ts` (`callDeepSeekJson`) with **retry ×2 + validation** (replaced the old 4-way duplicated callDeepSeek; temperature unified to 0). Real data occasionally drops a field / overflows JSON — retry is what made the real test robust.
- ✅ **Real acceptance test PASSED (2026-06-24)** via `scripts/test-real.mts`: real resume PDF (parsed by MVP's `parsePdfResume`) + 3 real JDs. Correct differentiation — 米哈游 AI应用PM → 【目标】, 字节(数据运营骨头) → 【跳板】, 丁香园(医药跨行业) → 【跳板·边界 + fork】. Each ④ re-packaged the same ResuMatch project three different ways.

Not done: ⑤ assembly node; user-intent **dialog** collection (currently a hardcoded struct in `scripts/`); front-end wiring; scoring收口. Minor polish: ④ could explicitly consume ③'s warnings/fork; `try-pipeline.mts` print not yet updated for the new ③ dimensions.

`learning-1.5/` lab stays a local untracked side branch; the real agent work now lives in `lib/agents/`.

## Outstanding / Unverified (honest status)

- `QA-0001` real `.docx` end-to-end regression: the previous state recorded it as blocked (no real `.docx` sample). The MVP is deployed and owner-checked, but there is **no commit evidence that the formal real-docx upload -> analyze -> /result -> export regression was completed**; treat it as still open.
- Not confirmed by record: real DeepSeek `/api/analyze` with a real docx sample, the full browser file-upload flow, and an actual in-app Word download/open check.

## Known Risks

- PDF parsing is still the single biggest instability point: text PDFs are supported, but internal text structure differs a lot between PDFs and can break line order or extraction.
- Scanned / image PDF OCR is not implemented and is out of MVP scope.
- Match scores can vary between repeated AI runs; accepted for MVP, deferred to v2.
- In-memory rate-limit counters reset on process restart and are not shared across instances; fine for MVP/preview only, replace with Vercel KV before multi-instance production.
- `xlsx@0.18.5` has a high audit issue with no casual fix; `next` / `postcss` have a moderate audit issue. Do not force-fix.
- `pdfjs-dist@5.7.284` requires Node `>=22.13.0 || >=24`; Vercel is pinned to `24.x` via `package.json` `engines.node`.

### 2.0 agent rebuild — known issues (2026-06-24)

- ✅ **③ match-judge verdict stability — FIXED (2026-06-24)**: refactored to "model emits signals (directionFit / hitsHardNo / growthRoom) → backend `decideVerdict()` rule sets the tier". Tier now 5/5 stable even when underlying signals wobble, because the backend if-else absorbs the wobble (temperature 0.3→0 alone did NOT fix it — DeepSeek is non-deterministic even at t=0, and "跳板 vs 该绕开" is a genuine boundary). Boundary cases get `isBoundary: true` + a `tradeoff` string for the user to decide (the "结合" / A+B approach). Also raised ③ `max_tokens` 2000→4000 (reasoning+tradeoff were overflowing and truncating the JSON). ⚠️ 2026-10-17：5/5 是旧模型时代的实测；DeepSeek 09-10 换代后以判级评测集为准（见顶部）。
- ✅ **④ ignores ③'s verdict — FIXED (2026-10-17)**: ④ 的口径跟 ③ 的 tier 走——该绕开先说"不建议优先投"和原因，再给"如果仍想投"的精简打法；跳板保留探虚实反问。
- ✅ **callDeepSeek duplicated — DONE**: 各节点已统一用 `lib/agents/deepseek.ts` 的 `callDeepSeekJson`。
- LangGraph node names must NOT collide with state channel names (hit twice). Convention: node names = verbs (`analyzeJd`, `planActions`), channels = nouns (`jdAnalysis`, `actionPlan`).

## Key Files

- `app/page.tsx` - homepage upload/JD/analyze start flow.
- `app/result/page.tsx` - result rendering and session report loading.
- `app/api/parse-resume/route.ts` - resume parsing API.
- `app/api/analyze/route.ts` - analysis API.
- `app/api/export-word/route.ts` - Word export API.
- `lib/deepseek-client.ts` - DeepSeek call, JSON parsing, retry, validation.
- `lib/analysis-prompt.ts` - DeepSeek prompt.
- `lib/analysis-schema.ts` - request/report validation.
- `lib/segment-original-validator.ts` - original text matching and annotation positioning safety.
- `types/analysis.ts` - report data shape.
- `docs/current/ANALYSIS_ENGINE_SPEC.md` - analysis engine specification.

## Deployment Notes

- Deployed on Vercel. Node `24.x` from `package.json` `engines.node` (satisfies `pdfjs-dist`).
- Build command: default `npm run build`.
- Node.js runtime routes: `/api/analyze`, `/api/parse-resume`, `/api/export-word`.
- Required production env var: `DEEPSEEK_API_KEY`. Optional: `DEEPSEEK_MODEL`, `DEEPSEEK_API_BASE_URL`.
- Full deploy steps and checks: see `PRODUCTION_CHECKLIST.md`.

## Suggested Next Sequence

1. ✅ Done (2026-06-24): ③ stability fixed via signals→backend-rule; ④ already conditions on ③'s tier (interview/salary tips revolve around the "跳板" verdict).
2. ⑤ assembly node + surface ③'s `tradeoff` / `isBoundary` in the front-end so boundary cases let the user decide.
3. ⑤ assembly node → stable structure for the front-end.
4. User-intent dialog collection (replace the hardcoded struct in `try-pipeline.mts`).
5. Wire the pipeline to the result page; extract shared `lib/agents/deepseek.ts`.
6. Owner to run `try-pipeline.mts` on real JD + real resume and judge quality.
7. Old MVP `lib/deepseek-client.ts` analyze chain stays untouched until the new pipeline is ready to replace it.

## 2026-06-26 · 2.0 前端核心闭环已建（最新，接手先读这条）
**接手先读 `docs/current/HANDOFF-2026-06-26.md`(含 journey + 决策 + 下一步)。** 一句话:输入页 `/agent` / 研判报告 `/agent-result` / 军师对话 / 公司背调 均已真跑通并经用户实测;风格锁定新国风(暖宣纸+竹青+节节高判断尺);按"**功能优先、最后统一搞网页**"推进,下一个功能 = 修改简历+导出。计划与进度见 `V2-BUILD-PLAN.md`,暂存的网页改版见 `V2-UI-REVAMP-PARKED.md`。

## 2026-06-24 晚 · 收尾状态 + handoff

- **后端集成完成**：`/api/agent-analyze` route 接通工作流（tsconfig `allowImportingTsExtensions` + exclude `learning-1.5`/`scripts`，`npm run build` 过）。旧 MVP 路由未动。
- **费曼尺**已写进 ③④ prompt（不一刀切版：保留必要术语和解释，砍"绕"不砍"深"）。
- **产品定位升级（重要）**：报告要信息密度高、内容详尽——逐条需求分析 / 排雷 / 岗位要求 / 简历指导 / 求职指导全包，目标替代花钱报班。影响：工作流输出要更详尽、风格要能装大量文字。
- **风格未定（当前卡点）**：B「简报/批注感」mockup 用户嫌太简约（内容会很多）；待画 A「报告/密件感」、C「杂志感」对比。标题用「岗位 + 公司」非总起句；避 SaaS 卡片堆。
- **下一步**：定风格 → ②③ 接前端（输入页含 OCR 百度 API + 意图采集；结果页按定的风格）→ 浏览器端到端实测。
- **完整对话 handoff**（journey + 决策 + 未决）：`docs/current/HANDOFF-2026-06-24.md`（同目录）。

## Workflow Pointer

Use `AGENTS.md` for repository rules, `docs/current/TASK_CARD_TEMPLATE.md` for new task cards, and `docs/current/ANALYSIS_ENGINE_SPEC.md` for the analysis engine spec.
