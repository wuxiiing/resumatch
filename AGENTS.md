# ResuMatch Agent Guide

This file is the short context entry for Codex agents. Read this first, then read `docs/current/PROJECT_STATE.md`.

## Automatic Low Token Workflow

For every coding, repo maintenance, QA, handoff, or multi-window task in this repository:

- First apply the `low-token-coding-workflow` skill when available.
- Read only `AGENTS.md` and `docs/current/PROJECT_STATE.md` as entry context.
- Do not default-read `IMPLEMENTATION_LOG.md`, `FRONTEND_DESIGN_GUIDE.md`, `project_handover_resumatch.md`, `docs/codex-handoffs/*`, or `docs/archive/*`.
- Only read files directly relevant to the current task.
- Keep reports short: changed files, validation, risks or unfinished items.

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

## Low Token Rules

- Default context: `AGENTS.md` + `docs/current/PROJECT_STATE.md` + the specific files in the task card.
- Do not default-read long history files: `IMPLEMENTATION_LOG.md`, `FRONTEND_DESIGN_GUIDE.md`, `project_handover_resumatch.md`, or `docs/codex-handoffs/*`.
- Search long docs only when a task needs exact history, prior decisions, or checkpoint evidence.
- Do not paste full command outputs when a short summary is enough.
- Do not append full construction reports to `AGENTS.md`; use `IMPLEMENTATION_LOG.md` only when needed.

## Local Preview Rules

- For owner review, use a persistent local dev server when possible.
- If localhost or the in-app browser is blocked, record the blocker and stop retrying.
- Build/lint are the baseline checks for code tasks; browser checks are used when UI behavior matters.

## Dev Server And Browser Budget

- Do not repeatedly start dev servers; first check whether an existing server is reachable.
- Prefer the user/owner-run dev server for UI checks.
- Do not run long-lived `npm run dev` in the foreground.
- If a dev server must be started, use a bounded/background method and stop it after validation.
- Browser automation is limited to one short attempt unless the task explicitly asks for more.
- If file upload, localhost access, or browser automation is blocked or unstable, stop retrying and report it as an environment limitation.
- Prefer source, API, or sessionStorage validation over repeated full UI automation.
- For logs, inspect only key errors or the last 80 lines.

## Final Report Format

- Changed files.
- Checks actually run.
- Business code changed: yes/no.
- Risks or unfinished items.
- One recommended next step.
