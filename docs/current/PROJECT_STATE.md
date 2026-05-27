# ResuMatch Current State

Last updated: 2026-05-27

## Project Snapshot

- Path: `D:\AI-workspace\Codex\ResuMatch`
- App: Next.js App Router + Tailwind CSS.
- Current observed branch: `main...origin/main [ahead 18]`.
- Latest known checkpoint: `f410f77 checkpoint: stabilize resume annotations pipeline`.
- Current observed dirty tree before `HISTORY-0001`: `lib/mock-report.ts` modified; `.agents/`, `.rescue-backups/`, and `skills-lock.json` untracked. Preserve these unless the owner explicitly opens a cleanup/checkpoint window.

## Current Product Status

- Homepage and result page exist.
- Multi-format resume parsing is checkpointed:
  - `.docx`
  - `.xlsx`
  - text-based `.pdf`
  - UTF-8 `.txt`
- JD input limit: 1000 characters.
- Resume text limit: 3000 characters.
- DeepSeek analysis main flow is checkpointed.
- Resume annotation pipeline is checkpointed.
- Result page has an inline resume annotation viewer.
- Homepage analysis loading now uses a frosted form-lock overlay.
- Homepage opening animation keeps the first-entry brand moment, then skips automatic replay in the same browser session.
- Result page now uses current `sessionStorage` report first, then browser-local history, then a real empty state; ordinary users no longer see mock fallback when no session report exists.
- Owner has checked the current `/result` experience after the annotations work.
- Owner considers the current result page close enough for MVP; do not keep polishing result-page UI before finishing the MVP loop unless a concrete blocker appears.
- PDF parsing now rebuilds extracted text by PDF text coordinates instead of collapsing a page into one line; real PDF/Word sample parity still needs QA because source PDF text can differ from the Word source.

## Current Focus

- The current core flow is usable enough to finish the MVP.
- Current strategy: finish MVP first, then consider a second version with an AI-agent architecture.
- Owner accepts the current result quality for MVP even though scoring can still vary between runs; do not keep tuning scoring or prompt stability before MVP unless a concrete blocker appears.
- Score stability is a second-version topic: consider fixed rubrics, same-input caching, calibration examples, or an AI-agent flow after the MVP is shipped.
- Next recommended task: `QA-0001` real sample regression across the finished MVP loop.
- `PERF-0001-A` analysis-chain engineering stability is complete: truncation/non-JSON/invalid-report/annotation-location fake-fetch coverage exists without prompt changes.
- `PERF-0001-C` analysis latency diagnostics are implemented without prompt changes; owner still needs 1-3 redacted manual runs to summarize real timing distribution.
- After `EXPORT-0001`, finish real-sample QA and deployment preparation.
- `EXPORT-0001` first-pass clean Word export is implemented: the result page can request an in-memory `.docx` report with summary, job direction, JD coverage summary, clean resume text, and improve annotations.

## Key Files

- `app/page.tsx` - homepage upload/JD/analyze start flow.
- `app/result/page.tsx` - result rendering and session report loading.
- `app/api/parse-resume/route.ts` - resume parsing API.
- `app/api/analyze/route.ts` - analysis API.
- `lib/deepseek-client.ts` - DeepSeek call, JSON parsing, retry, validation.
- `lib/analysis-prompt.ts` - DeepSeek prompt.
- `lib/analysis-schema.ts` - request/report validation.
- `lib/segment-original-validator.ts` - original text matching and annotation positioning safety.
- `types/analysis.ts` - report data shape.

## Known Risks

- `xlsx@0.18.5` has a high audit issue with no casual fix.
- `next` / `postcss` moderate audit issue exists; do not force-fix.
- `pdfjs-dist@5.7.284` requires Node `>=22.13.0 || >=24`; deployment prep pins Vercel Node to `24.x` through `package.json` `engines.node`, but preview must still smoke-test text PDF parsing.
- Analysis requests can still be slow, but the latest real sample timing was acceptable for MVP.
- Match scores can vary between repeated AI runs; this is accepted for MVP and should be addressed in the second version instead of destabilizing the current prompt/report flow.
- Scanned/image PDF OCR is not implemented.
- Word export first pass is implemented; browser/manual Word opening still needs one real-report owner check if local browser automation is unavailable.
- `LIMIT-0001` is implemented as an MVP in-memory `/api/analyze` limiter: 5 analyses per IP per Beijing day and 500 analyses per site per Beijing day.
- In-memory rate limit counters reset on process restart and are not shared across multiple deployment instances; this is acceptable only for small MVP traffic or preview, and should be replaced with Vercel KV before multi-instance production traffic.
- Browser-local report history is device/browser local only and intentionally does not provide login, database, or cross-device sync.
- Result-page copy tells users that history is stored only in the current browser and cannot be recovered after local data is cleared.
- `TASKS.md` was historically out of date; use this file as the current control-room source after the 2026-05-26 sync.
- Vercel env vars and production deploy checks are documented in `PRODUCTION_CHECKLIST.md`; owner still needs to configure the real Vercel values.

## Deployment Notes

- Node version: Vercel should use `24.x` from `package.json` `engines.node`; this satisfies `pdfjs-dist@5.7.284`.
- Build command: default `npm run build`.
- Next config: no deployment-specific `next.config.ts` option is currently required.
- API runtime: `/api/analyze`, `/api/parse-resume`, and `/api/export-word` are Node.js runtime routes.
- Required production env var: `DEEPSEEK_API_KEY`.
- Optional production env vars: `DEEPSEEK_MODEL`, `DEEPSEEK_API_BASE_URL`.
- Deployment path: local lint/build -> Vercel env vars -> preview deploy -> smoke test -> production deploy.

## Latest QA Notes

- `QA-0001` partial regression ran on 2026-05-27.
- Passed: `npm run lint`, `npm run build`, `scripts/verify-rate-limit.mjs`, and `scripts/verify-export-word.mjs`.
- Browser smoke passed with a synthetic report: mobile `/result` order is job direction, keyword analysis, then resume review; local history can be selected, deleted, and cleared; `/api/export-word` returns a non-empty Word document response.
- Real local sample smoke passed for PDF parsing via `/api/parse-resume` using an existing PDF outside this repo; parsed as `pdf` with extracted text present.
- Blocked: no real `.docx` sample was found in the repo or nearby `D:\AI-workspace\Codex` search paths, so the required docx upload-to-`/result` real-sample regression is still incomplete.
- Not run: real DeepSeek `/api/analyze` with a real docx sample, full browser file-upload flow, and actual Word download/open check in the in-app browser.
- Environment note: direct background dev-server startup had Windows `Path/PATH` and process lifetime issues; QA used a bounded PowerShell job for local browser/API checks.

## Recent Checkpoints

- `21208b5 checkpoint: add resume annotations result UI`
- `345fddc checkpoint: add inline resume annotation viewer`
- `f410f77 checkpoint: stabilize resume annotations pipeline`

## Suggested Next Sequence

1. Finish `QA-0001` with an owner-provided real `.docx` sample and redacted JD, then verify upload -> analyze -> `/result` end to end.
2. `MVP-CLEANUP-0001` remaining production copy and development-entry cleanup before public review.
3. `DEPLOY-0001` Vercel deployment preparation.
4. `RM-0028` PDF/Word parity QA if real samples still produce meaningfully different reports after coordinate-based PDF line restoration.
5. `SCORE-0002` scoring calibration/caching/rubric work for version 2, not the MVP.
6. `AGENT-0001` JD research agent design for a second version, not the MVP.

## Workflow Pointer

Use `AGENTS.md` for repository rules and `docs/current/TASK_CARD_TEMPLATE.md` for new task cards.
