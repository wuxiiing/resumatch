# ResuMatch Current State

Last updated: 2026-05-26

## Project Snapshot

- Path: `D:\AI-workspace\Codex\ResuMatch`
- App: Next.js App Router + Tailwind CSS.
- Current observed branch: `main...origin/main [ahead 16]`.
- Latest known checkpoint: `f410f77 checkpoint: stabilize resume annotations pipeline`.
- Current observed dirty tree: `lib/mock-report.ts` modified; `.agents/`, `.rescue-backups/`, and `skills-lock.json` untracked. Preserve these unless the owner explicitly opens a cleanup/checkpoint window.

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
- Owner has checked the current `/result` experience after the annotations work.
- Owner considers the current result page close enough for MVP; do not keep polishing result-page UI before finishing the MVP loop unless a concrete blocker appears.

## Current Focus

- The current core flow is usable enough to finish the MVP.
- Current strategy: finish MVP first, then consider a second version with an AI-agent architecture.
- Next recommended task: `PERF-0001` analysis latency and output truncation optimization.
- `PERF-0001-A` analysis-chain engineering stability is complete: truncation/non-JSON/invalid-report/annotation-location fake-fetch coverage exists without prompt changes.
- `PERF-0001-C` analysis latency diagnostics are implemented without prompt changes; owner still needs 1-3 redacted manual runs to summarize real timing distribution.
- After `PERF-0001`, finish `LIMIT-0001`, `EXPORT-0001`, real-sample QA, and deployment preparation.
- Word export may start after `PERF-0001` and `LIMIT-0001`; the owner has accepted the current result-page experience as close enough for MVP.

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
- `pdfjs-dist@5.7.284` requires Node `>=22.13.0 || >=24`; confirm Vercel runtime before production.
- Analysis requests can still be slow; performance work is pending.
- Scanned/image PDF OCR is not implemented.
- Word export is not implemented.
- IP/global daily rate limits are not implemented.
- The homepage currently states a daily IP limit, but `/api/analyze` does not enforce it yet. This is an MVP blocker unless the copy is changed.
- The result page still falls back to mock data when no session report exists. Decide the official MVP behavior before public review.
- `TASKS.md` was historically out of date; use this file as the current control-room source after the 2026-05-26 sync.
- Vercel env vars and production deploy checks are pending.

## Recent Checkpoints

- `21208b5 checkpoint: add resume annotations result UI`
- `345fddc checkpoint: add inline resume annotation viewer`
- `f410f77 checkpoint: stabilize resume annotations pipeline`

## Suggested Next Sequence

1. `PERF-0001` analysis latency and output truncation optimization.
2. `LIMIT-0001` `/api/analyze` IP/global rate limiting.
3. `EXPORT-0001` Word report export.
4. `QA-0001` real sample regression across parse, analyze, result, export, and limit behavior.
5. `DEPLOY-0001` Vercel deployment preparation.
6. `MVP-CLEANUP-0001` production copy/mock/history cleanup before public review.
7. `RM-0028` PDF parsing paragraph restoration if real samples show PDF layout quality is still blocking.
8. `AGENT-0001` JD research agent design for a second version, not the MVP.

## Workflow Pointer

Use `AGENTS.md` for repository rules and `docs/current/TASK_CARD_TEMPLATE.md` for new task cards.
