# ResuMatch Current State

Last updated: 2026-06-24

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

- ✅ **③ match-judge verdict stability — FIXED (2026-06-24)**: refactored to "model emits signals (directionFit / hitsHardNo / growthRoom) → backend `decideVerdict()` rule sets the tier". Tier now 5/5 stable even when underlying signals wobble, because the backend if-else absorbs the wobble (temperature 0.3→0 alone did NOT fix it — DeepSeek is non-deterministic even at t=0, and "跳板 vs 该绕开" is a genuine boundary). Boundary cases get `isBoundary: true` + a `tradeoff` string for the user to decide (the "结合" / A+B approach). Also raised ③ `max_tokens` 2000→4000 (reasoning+tradeoff were overflowing and truncating the JSON).
- **④ ignores ③'s verdict**: ④ still gives a full "how to win" plan even when ③ says "该绕开". ④ should condition on ③ (e.g. "if you still want in, here's how").
- **callDeepSeek duplicated** in all 4 node files; extract a shared `lib/agents/deepseek.ts` during cleanup.
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
