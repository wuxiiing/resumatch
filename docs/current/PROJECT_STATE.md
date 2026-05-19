# ResuMatch Current State

Last updated: 2026-05-19

## Project Snapshot

- Path: `D:\AI-workspace\Codex\ResuMatch`
- App: Next.js App Router + Tailwind CSS.
- Branch after latest checkpoint: `main...origin/main [ahead 9]`.
- Latest known checkpoint: `0990f94 feat: add DeepSeek analysis flow`.
- One untracked handoff doc may exist: `docs/codex-handoffs/2026-05-19-resumatch-control-room-handoff.md`.

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
- Owner confirmed a real browser flow reached `/result` and showed a real report.

## Important Current Concern

- Owner reported that the "简历分析详情" card may not output expected content.
- Next practical step is to open the site and retest that result-page detail card with a real analysis report.
- Do not start Word export until this UI/content issue is understood.

## Key Files

- `app/page.tsx` - homepage upload/JD/analyze start flow.
- `app/result/page.tsx` - result rendering and session report loading.
- `app/api/parse-resume/route.ts` - resume parsing API.
- `app/api/analyze/route.ts` - analysis API.
- `lib/deepseek-client.ts` - DeepSeek call, JSON parsing, retry, validation.
- `lib/analysis-prompt.ts` - DeepSeek prompt.
- `lib/analysis-schema.ts` - request/report validation.
- `lib/segment-original-validator.ts` - `segments.original` exact-match safety.
- `types/analysis.ts` - report data shape.

## Known Risks

- `xlsx@0.18.5` has a high audit issue with no casual fix.
- `next` / `postcss` moderate audit issue exists; do not force-fix.
- `pdfjs-dist@5.7.284` requires Node `>=22.13.0 || >=24`; confirm Vercel runtime before production.
- Scanned/image PDF OCR is not implemented.
- Word export is not implemented.
- IP/global daily rate limits are not implemented.
- Vercel env vars and production deploy checks are pending.

## Do Not Default Read

- `IMPLEMENTATION_LOG.md` - long history; search only for exact task evidence.
- `FRONTEND_DESIGN_GUIDE.md` - long design guide; read only for visual work.
- `project_handover_resumatch.md` - old handoff context.
- `docs/codex-handoffs/*` - archive/control-room handoffs; read only for handoff recovery.
- `docs/archive/*` - archive only.

## Workflow Notes

- Keep task cards short.
- Reduce QA loops; owner handles product experience confirmation.
- Construction windows should return changed files and checks, not long narratives.
- Do not print secrets or full private input.
- Do not push without explicit owner approval.
