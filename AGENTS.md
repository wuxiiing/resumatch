# ResuMatch Agent Guide

Short entry context for Codex, Claude, and CC agents. Read this file first, then `docs/current/PROJECT_STATE.md`.

## Low Token Workflow

- Apply `low-token-coding-workflow` first when that skill is available.
- Default context: `AGENTS.md`, `docs/current/PROJECT_STATE.md`, and files named by the task card.
- Do not default-read long history docs: `IMPLEMENTATION_LOG.md`, `FRONTEND_DESIGN_GUIDE.md`, `project_handover_resumatch.md`, `docs/codex-handoffs/*`, or `docs/archive/*`.
- Search long docs only when the task needs exact history, prior decisions, or checkpoint evidence.
- Keep reports short: changed files, validation, business-code impact, risks or unfinished items, and one next step.

## Common Commands

- `npm run dev` - start the Next.js dev server.
- `npm run lint` - run ESLint with zero warnings.
- `npm run build` - run a production build.
- `git status --short --branch` - check current branch and dirty files.

## Scope Rules

- Do not modify business code unless the task card explicitly allows it.
- For documentation-only tasks, do not touch `app/`, `lib/`, `package.json`, or `package-lock.json`.
- Keep task cards short: goal, allowed files, forbidden files, checks, return format.
- Construction windows should focus on code changes and minimum self-checks. Product experience is confirmed by the owner.
- Control room may maintain `IMPLEMENTATION_LOG.md`; other root docs need explicit owner approval.

## Safety Rules

- Never print or commit real API keys, `.env.local`, full resumes, full JDs, or full model raw responses.
- DeepSeek and future OCR keys must come from local `.env.local` or Vercel Environment Variables.
- Do not run `npm audit fix --force` without explicit approval.
- Do not push unless the owner explicitly asks.
- Do not reset, restore, delete, or discard user changes unless explicitly requested.

## Local Preview Rules

- Build/lint are the baseline checks for code tasks; browser checks are used when UI behavior matters.
- Before starting a dev server, check whether one is already reachable.
- Prefer owner-run or persistent local dev servers for review.
- If a dev server must be started, use a bounded/background method and stop it after validation.
- Limit browser automation to one short attempt unless the task explicitly asks for more.
- If file upload, localhost access, or browser automation is blocked or unstable, stop retrying and report it as an environment limitation.
- Prefer source, API, or sessionStorage validation over repeated full UI automation.
- For logs, inspect only key errors or the last 80 lines.

## Final Report Format

- Changed files.
- Checks actually run.
- Business code changed: yes/no.
- Risks or unfinished items.
- One recommended next step.
