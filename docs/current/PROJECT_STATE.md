# ResuMatch Current State

Last updated: 2026-05-21

## Project Snapshot

- Path: `D:\AI-workspace\Codex\ResuMatch`
- App: Next.js App Router + Tailwind CSS.
- Branch after latest checkpoint: `main...origin/main [ahead 12]`.
- Latest known checkpoint: `f410f77 checkpoint: stabilize resume annotations pipeline`.
- Working tree was clean at the last status check.

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

## Current Focus

- The current core flow is usable enough to continue product polish.
- Next recommended task: `PERF-0001` analysis latency and output truncation optimization.
- Do not start Word export until the owner confirms the current result-page experience is good enough.

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
- Vercel env vars and production deploy checks are pending.

## Recent Checkpoints

- `21208b5 checkpoint: add resume annotations result UI`
- `345fddc checkpoint: add inline resume annotation viewer`
- `f410f77 checkpoint: stabilize resume annotations pipeline`

## Suggested Next Sequence

1. `PERF-0001` analysis latency and output truncation optimization.
2. `LIMIT-0001` `/api/analyze` IP/global rate limiting.
3. `EXPORT-0001` Word report export.
4. `DEPLOY-0001` Vercel deployment preparation.
5. `QA-0001` real sample regression.
6. `RM-0028` PDF parsing paragraph restoration.
7. `AGENT-0001` JD research agent design for a later phase.

## Workflow Pointer

Use `AGENTS.md` for repository rules and `docs/current/TASK_CARD_TEMPLATE.md` for new task cards.
