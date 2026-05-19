# ResuMatch Control Room Handoff - 2026-05-19

## Role

This is a control-room handoff. The next control room should not implement business code unless the owner explicitly changes that rule.

Use the low-token workflow:

- Read `AGENTS.md`.
- Read `docs/current/PROJECT_STATE.md`.
- Read `docs/current/TASK_CARD_TEMPLATE.md` when writing task cards.
- Do not default-read `IMPLEMENTATION_LOG.md`, `FRONTEND_DESIGN_GUIDE.md`, old handoffs, or archive docs.
- Search long docs only for exact sections when a task card explicitly allows it.

## Current Repo Snapshot

- Path: `D:\AI-workspace\Codex\ResuMatch`
- Branch: `main`
- Latest checkpoint: `0990f94 feat: add DeepSeek analysis flow`
- Branch state before this handoff: `main...origin/main [ahead 9]`
- Not pushed.

Current known dirty files:

```text
 M app/result/page.tsx
 M components/ReportViewer.tsx
 M components/SummarySidebar.tsx
?? AGENTS.md
?? docs/codex-handoffs/2026-05-19-resumatch-control-room-handoff.md
?? docs/current/
```

Do not reset, restore, or overwrite these files. They are expected local work from context slimming and result-page frontend refinement.

## Completed Recently

- CTX-0001: added short context entry files:
  - `AGENTS.md`
  - `docs/current/PROJECT_STATE.md`
- Added task card template:
  - `docs/current/TASK_CARD_TEMPLATE.md`
- Created global skill:
  - `D:\Codex-Home\.codex\skills\low-token-coding-workflow\SKILL.md`
- CTX-0002 / CTX-0003: strengthened low-token and dev-server/browser retry rules.
- DeepSeek analysis main flow checkpointed at `0990f94`.
- ENV-0001 cleared stale `.next` cache and confirmed `/result` can open after restart.

## Current Product Issue

The owner says the result page has drifted away from the original design and product intent.

Observed issue:

- The left-side resume detail area no longer feels like the original resume annotation report.
- Empty-detail fallback became too mechanical.
- The product should help users understand what the JD implies, what HR likely cares about, and how to improve resume pass rate.
- Do not start Word export until the result-page information structure is corrected.

## Current Frontend Work

RM-0024-R1 changed:

- `app/result/page.tsx`
- `components/ReportViewer.tsx`
- `components/SummarySidebar.tsx`

Reported checks:

- `npm run lint` passed.
- `npm run build` passed.
- Browser short verification initially hit stale `.next` chunk 500; ENV-0001 later cleared local cache and `/result` opened.

The owner has not yet accepted the product result. Treat this as in-progress frontend refinement, not a checkpoint.

## Next Task

Issue the internal card named:

`RM-0024-R2 按设计指南修正 /result 简历详情与岗位诊断结构`

This card may allow reading only the relevant parts of `FRONTEND_DESIGN_GUIDE.md`.

The goal is to restore the result page information structure:

- State A: real displayable resume segments exist.
  - Show `简历分析详情`.
  - Keep green/yellow/gray segment cards.
  - Yellow cards show improvement advice.
- State B: no real displayable segments exist.
  - Do not show `简历分析详情`.
  - Show `岗位匹配诊断` or `简历与岗位匹配诊断`.
  - Do not fake multiple resume-experience cards.
  - Do not repeat generic `与 JD 匹配` tags.
  - Show three useful sections:
    - `岗位真正看重什么`
    - `简历已经体现的优势`
    - `优先补强的缺口与改写方向`

Do not modify backend, prompt, schema, dependencies, or Word export logic.

## Important Operating Rules

- The owner wants less repeated QA and less browser automation.
- Browser/dev-server checks get one short attempt unless explicitly requested.
- If localhost, file upload, or in-app browser automation is unstable, stop and report the blocker.
- The owner confirms product experience manually.
- Construction windows should return concise reports only.
- Do not print secrets, full resumes, full JDs, or full model raw responses.

## Suggested Later Sequence

After RM-0024-R2:

1. Owner manually reviews `/result`.
2. If accepted, checkpoint context docs and result-page frontend changes.
3. Then continue with:
   - segments matching logic optimization
   - `/api/analyze` IP rate limiting
   - Word export
   - job-coach style prompt/schema upgrade
   - Vercel deployment preparation
   - OCR fallback
