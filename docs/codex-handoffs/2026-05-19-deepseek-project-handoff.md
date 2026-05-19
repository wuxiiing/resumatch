# ResuMatch DeepSeek Project Handoff - 2026-05-19

## How To Start

You are taking over the ResuMatch project from Codex.

Read first:

- `AGENTS.md`
- `docs/current/PROJECT_STATE.md`
- `docs/current/TASK_CARD_TEMPLATE.md`

Do not default-read long history files:

- `IMPLEMENTATION_LOG.md`
- `FRONTEND_DESIGN_GUIDE.md`
- `project_handover_resumatch.md`
- `docs/codex-handoffs/*`
- `docs/archive/*`

Only read long docs when a task explicitly allows a small relevant section.

## Repo Snapshot

- Project path: `D:\AI-workspace\Codex\ResuMatch`
- Branch: `main`
- Latest known checkpoint: `0990f94 feat: add DeepSeek analysis flow`
- Current branch state at handoff: `main...origin/main [ahead 9]`
- Do not push unless the owner explicitly asks.

Current dirty worktree:

```text
 M app/result/page.tsx
 M components/ReportViewer.tsx
 M components/SummarySidebar.tsx
 M lib/analysis-prompt.ts
 M lib/analysis-schema.ts
 M lib/mock-analysis.ts
 M types/analysis.ts
?? AGENTS.md
?? docs/codex-handoffs/2026-05-19-control-room-handoff-low-token.md
?? docs/codex-handoffs/2026-05-19-resumatch-control-room-handoff.md
?? docs/current/
```

Do not reset, restore, or overwrite these changes without the owner's explicit instruction.

## What Is Already Checkpointed

Checkpoint `0990f94 feat: add DeepSeek analysis flow` contains:

- DeepSeek `/api/analyze` main flow.
- JSON output repair and validation.
- `segments.original` exact-match safety.
- Homepage to `/result` main session flow.
- Multi-format parsing had already been checkpointed before that.

The branch is ahead of origin and has not been pushed.

## What Is In Progress

### Context / Workflow Docs

These are new low-token workflow files and should be kept:

- `AGENTS.md`
- `docs/current/PROJECT_STATE.md`
- `docs/current/TASK_CARD_TEMPLATE.md`
- `docs/codex-handoffs/2026-05-19-control-room-handoff-low-token.md`

They exist to reduce token use and prevent repeated browser/dev-server loops.

### Frontend Result Page Work

These files were changed during result-page refinement:

- `app/result/page.tsx`
- `components/ReportViewer.tsx`
- `components/SummarySidebar.tsx`

The owner said the current direction still feels off and drifted from the intended product. Treat these changes as in-progress, not accepted, not checkpointed.

### Annotation Schema / Prompt Work

These files were changed for the new "resume original correction annotations" direction:

- `types/analysis.ts`
- `lib/analysis-schema.ts`
- `lib/analysis-prompt.ts`
- `lib/mock-analysis.ts`

RM-0024-B summary:

- Added `AnnotationStatus = keep | improve | remove`.
- Added `ResumeAnnotation`.
- `AnalysisReport` now includes `resumeOriginal` and `annotations`, while keeping `segments`.
- `validateAnalysisReport` validates `resumeOriginal` and `annotations`; `improve` requires `rewriteExample`.
- Prompt asks DeepSeek to output `annotations`.
- Prompt says `annotations.original` must exactly quote a continuous resume substring.
- Prompt says ordinary irrelevant-but-harmless content should not get an annotation.
- Prompt says DeepSeek should not output the full `resumeOriginal`; server should fill it.
- `npm run lint` and `npm run build` reportedly passed.

This is not checkpointed yet.

## Product Direction

The product should not be a generic "analysis report" or keyword matcher.

The owner wants:

- A JD-based resume original correction tool.
- Preserve the user's original resume structure and order.
- Mark useful resume text green: keep.
- Mark promising but weak expression yellow: improve, with rewrite suggestions.
- Leave harmless ordinary text uncolored.
- Mark clearly irrelevant or focus-diluting text gray: remove or weaken.
- Show JD pain-point interpretation separately so users understand why changes matter.

Do not start Word export until this result-page information structure is corrected.

## Next Recommended Task

Continue with:

`RM-0024-C 接入 resumeOriginal + annotations API/mock 数据`

Goal:

Make `/api/analyze` return usable `resumeOriginal + annotations` for the future original-resume correction UI, and ensure mock data covers `keep / improve / remove`.

Allowed files:

- `app/api/analyze/route.ts`
- `lib/deepseek-client.ts`
- `lib/mock-analysis.ts`
- `lib/segment-original-validator.ts`
- if necessary: `lib/analysis-schema.ts`

Forbidden files:

- `app/result/page.tsx`
- `components/*`
- `lib/analysis-prompt.ts`
- `package.json`
- `package-lock.json`

Requirements:

1. API response must include `resumeOriginal`.
2. `resumeOriginal` must be filled by the server from `request.resumeText`, not by the model.
3. If the model returns an empty `resumeOriginal`, overwrite/fill it with `request.resumeText`.
4. Validate `annotations.original` against `resumeOriginal`.
5. Generate or fill `startIndex` and `endIndex` for each valid annotation.
6. For duplicate `original`, match forward in resume order instead of always using the first occurrence.
7. Invalid annotation originals should not go to the frontend; filter or trigger the existing repair retry.
8. Keep `segments` for old UI compatibility.
9. Mock report should cover `keep`, `improve`, and `remove`.
10. Do not change DeepSeek request parameters, prompt, UI, or dependencies.

Validation:

- `npm run lint`
- `npm run build`
- mock report passes `validateAnalysisReport`
- fake analyze returns `resumeOriginal` and `annotations`
- `startIndex/endIndex` correspond to `resumeOriginal`
- invalid originals do not reach the frontend

## After RM-0024-C

Then do:

1. `RM-0024-D result UI`: render original resume text in order using `resumeOriginal + annotations`.
2. Owner manually checks `/result`.
3. If accepted, checkpoint the context docs and final frontend/backend annotation work.

Later tasks:

- `/api/analyze` IP rate limiting.
- Word export.
- Prompt/schema "job coach" refinement.
- Vercel deployment preparation.
- OCR fallback.

## Operating Rules

- Keep tasks small and one-window only.
- Do not read long docs by default.
- Do not print secrets, full resumes, full JDs, or full model raw responses.
- Do not repeatedly start dev servers.
- Browser automation gets one short attempt only unless the owner explicitly asks for more.
- The owner confirms product experience manually.
- Do not submit/checkpoint the current frontend files until the owner accepts the new direction.
