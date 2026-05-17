# ResuMatch Codex Handoff - 2026-05-17

## 1. Repo / Path / Branch

- Repo path: `D:\AI-workspace\Codex\ResuMatch`
- Git root: `D:/AI-workspace/Codex/ResuMatch`
- Current branch: `main`
- Upstream: `origin/main`
- Remote: `https://github.com/wuxiiing/resumatch.git`
- Current branch state at handoff: `main...origin/main [ahead 3]`
- Current worktree state at handoff: dirty, with 14 modified tracked files and no untracked files reported by `git status --short --branch` before this handoff document was created.

## 2. Current Goal

ResuMatch is a Chinese resume / job-description matching product. The current active goal is to finish the first front-end phase before moving to backend work.

The immediate product objective is:

1. Keep the report page changes from RM-0007 / RM-0007-R1.
2. Finish RM-0008 / RM-0008-R1 homepage refinement.
3. Get project-owner visual approval.
4. Run a focused acceptance pass.
5. Create a checkpoint commit only after the owner confirms the UI is acceptable.

The current UI issue is homepage height and density. The homepage has been converted to a single-column step flow, but it is too tall and card-heavy. The owner wants the first viewport to show the whole flow more clearly: logo, short explanation, resume upload, job description input, start button, and light reminder text.

## 3. Completed Work

### Earlier stable commits already on `main`

- `1ed8f3b docs: add phase 0 workflow and handover docs`
- `934b42e docs: add frontend design guide`
- `2421fa4 feat: scaffold frontend app shell`

### Current uncommitted work already present in the worktree

- RM-0007 report page layout work:
  - Moved score summary toward a full-width report overview.
  - Added report legend placement changes.
  - Adjusted history sidebar truncation / layout stability.
  - Adjusted report viewer and sidebar card visual density.

- RM-0007-R1 report page rework:
  - Changed the right sidebar first card from "overall comment" to "job direction".
  - Added `jobDirection` static placeholder data.
  - Expanded suggestion summaries with descriptions.
  - Hid the visible horizontal keyword scrollbar while preserving horizontal keyword browsing.
  - Added pointer-drag and wheel-oriented keyword strip behavior.

- RM-0008 homepage work:
  - Converted homepage from a two-column placeholder into a single-column step-based page.
  - Added / preserved logo, history entry, resume upload section, job-description input section, start button, and reminder text.
  - Removed old development-facing copy such as "stage 1 placeholder", "no parsing", "no API", and "no Word generation" from the homepage.
  - Made file upload and job-description input client-side interactive placeholders.

- Workflow / project rules:
  - Added wrong-window guard: a construction window must stop and ask if a task conflicts with its assigned role.
  - Added control-room proposal and acceptance process.
  - Added task-card layering: construction cards, acceptance cards, and checkpoint cards.
  - Added local page acceptance rules: use `npm run dev` and `http://localhost:3000/` / `http://localhost:3000/result` for visual review; treat `npm run build` as deterministic build validation; treat `next start` issues as separate production-preview validation.

## 4. Key Files Modified Or Investigated

### Modified in current worktree

- `FRONTEND_DESIGN_GUIDE.md`
  - Front-end visual direction and homepage/report-page guidance.
  - Notes that the formal homepage should be GPT-style single-column step flow.
  - Notes that opening/logo animation is a later confirmation item, not part of the current task.

- `PROJECT_WORKFLOW.md`
  - Control-room rules, task-card generation rules, task-card layering, local page acceptance rules.

- `app/page.tsx`
  - Homepage single-column step layout.

- `components/FileUploader.tsx`
  - Client-side file selection placeholder and status display.

- `components/JDInput.tsx`
  - Client-side job-description textarea and `0 / 1000` counter.

- `components/Logo.tsx`
  - Logo sizing support.

- `components/ScoreDashboard.tsx`
  - Report score overview, keyword strips, hidden scrollbar, wheel and pointer scrolling.

- `app/globals.css`
  - `.keyword-scroll` scrollbar-hiding / touch scrolling rules.

- `app/result/page.tsx`
  - Report page composition and placement of score dashboard, legend, viewer, and sidebar.

- `components/HistorySidebar.tsx`
  - Sidebar layout stability and text truncation.

- `components/ReportViewer.tsx`
  - Report detail card and exported `ReportLegend`.

- `components/SummarySidebar.tsx`
  - `jobDirection` display, tighter suggestion list, export placeholder card.

- `lib/mock-report.ts`
  - Static report placeholder updates, including `jobDirection` and suggestion descriptions.

- `types/analysis.ts`
  - Added `JobDirectionItem`, `jobDirection`, and suggestion `description`.

### Investigated / context files

- `PROJECT_SCOPE.md`
- `TASKS.md`
- `project_handover_resumatch.md`
- Desktop handoff source: `E:\桌面\markdown总控窗口.doc`
- Desktop is now expected at `E:\桌面`, not `C:\Users\Administrator\Desktop`.

## 5. Commands / Tests / Checks Run

Commands run during the handoff creation and recent acceptance flow included:

- `git rev-parse --show-toplevel`
- `git status --short --branch`
- `git branch --show-current`
- `git remote get-url origin`
- `git diff --stat`
- `git diff --name-status`
- Local HTTP checks against dev server:
  - `http://localhost:3000/` returned `200`
  - `http://localhost:3000/result` returned `200`

Reported by the testing/acceptance window for RM-0008:

- `npm run lint`: passed, exit code 0
- `npm run build`: passed, exit code 0
- Next build generated `/` and `/result` static routes
- Dev server HTTP checks for `/` and `/result`: 200

The owner visually opened the homepage through the in-app browser at:

- `http://localhost:3000/`

## 6. Known Errors / Warnings / Failures

- The front-end construction window got stuck during automatic context compaction and did not produce a complete final handoff. Its file edits were already written to disk.
- The Codex in-app browser or Browser tooling has previously hit `net::ERR_BLOCKED_BY_CLIENT` against localhost / `127.0.0.1`. Do not loop endlessly on this blocker.
- A testing window reported `next start` production-preview failure: `Cannot find module './833.js'`. This is suspected to be local `.next` artifact / old process mismatch after multiple windows ran dev/build/start, not proof that source code is broken. `npm run build` passed and dev-server HTTP routes returned 200.
- Git shows LF-to-CRLF warnings on many modified files. Treat as line-ending noise unless the diff unexpectedly balloons.
- Current homepage visual issue: page is too vertically long; upload area and job-description area are too large/card-like; bottom reminders should not be cards.

## 7. Open Questions / Pending Decisions

- Homepage RM-0008-R1 needs a construction task:
  - Compress first viewport.
  - Consider merging resume upload and job-description input into one compact main panel.
  - Make upload area much smaller.
  - Use user-friendly wording instead of relying on "JD".
  - Replace bottom reminder cards with one lightweight sentence.

- Opening / logo animation:
  - The owner wants it remembered but not done now.
  - Confirm later after homepage structure is stable.
  - Current recommendation: light logo entrance animation, not full-screen splash, unless the owner asks otherwise.

- Visual acceptance:
  - Owner should visually review homepage after RM-0008-R1.
  - Owner should also review `/result` if needed, especially keyword wheel behavior and mobile width.

- Checkpoint:
  - Do not checkpoint yet if the homepage first-viewport issue remains.
  - After owner visual approval and acceptance checks, create a checkpoint commit.

- Backend:
  - Do not start backend until front-end phase checkpoint is accepted.
  - First backend task should likely be `.docx` text extraction only; do not jump directly to PDF/OCR/XLSX/DeepSeek.

## 8. User Preferences / Limits / Do-Not-Touch

- This thread/window acts as the ResuMatch core control room.
- The control room does planning, task cards, risk checks, acceptance, and checkpoint decisions.
- The control room should not directly implement business code unless the user explicitly changes that rule.
- Use named windows:
  - Frontend construction window
  - Backend construction window
  - Export construction window
  - Testing/acceptance window
  - Scout/read-only window
- Every construction window receives one clear task card at a time.
- Do not generate the next task card until the user explicitly allows it.
- For front-end/product/visual tasks, the project owner must visually inspect before the project moves on.
- Prefer short construction cards and separate acceptance cards:
  - Construction card: what to change, what not to change, minimal verification.
  - Acceptance card: diff scope, secrets, build/lint, browser/interaction checks.
  - Checkpoint card: commit readiness after owner approval.
- Do not reset, revert, discard, restore, or otherwise remove uncommitted changes unless the user explicitly asks.
- Do not modify:
  - Real backend/API/DeepSeek/file parsing/rate limit/Word export unless the task card explicitly says so.
  - `config.toml`
  - Secrets, tokens, or API keys.
- Do not print or commit secrets. Existing docs may mention placeholder env variable names; do not output actual secret values.
- First-version product scope excludes:
  - Login/register
  - Payment
  - PDF export
  - In-page resume editing
  - Multilingual support
  - One-click rewrite / one-click polish
  - Unapproved feature expansion

## 9. Next 3-7 Concrete Steps

1. Ask the owner whether to generate the RM-0008-R1 front-end construction card.
2. If approved, send a short construction card to the front-end construction window:
   - Only homepage first-viewport compression and wording refinement.
   - Allowed files likely: `app/page.tsx`, `components/FileUploader.tsx`, `components/JDInput.tsx`, maybe `components/Logo.tsx`.
   - Do not touch report page, backend, package files, or project docs.
3. After the front-end window finishes, send a focused acceptance card to the testing window:
   - `git status --short --branch`
   - `git diff --name-status`
   - `git diff --stat`
   - `npm run lint`
   - `npm run build`
   - `npm run dev` visual check on `http://localhost:3000/`
   - Check homepage fits first viewport better.
4. Have the owner visually inspect `http://localhost:3000/`.
5. If owner approves, perform or request checkpoint readiness review:
   - Confirm no scope creep.
   - Confirm no real secrets.
   - Confirm known `next start` issue is either resolved or documented as separate production-preview risk.
6. Create a checkpoint commit only after owner approval.
7. Then prepare the first backend task card, likely `.docx` resume text extraction only.

## 10. Reactivation Prompt For A New Codex Session

Copy this into a new Codex session if continuing from a fresh thread:

```text
你现在是 ResuMatch 项目的核心总控窗口，不是施工窗口。

项目目录：
D:\AI-workspace\Codex\ResuMatch

请先只读接手，不要修改业务代码，不要 reset / revert / discard / restore，不要 stage，不要 commit。

先检查：
1. git rev-parse --show-toplevel
2. git status --short --branch
3. git diff --name-status
4. git diff --stat

项目规则：
- 总控窗口只做规划、任务拆分、风险提醒、验收和 checkpoint 决策。
- 业务代码交给命名施工窗口。
- 每个施工窗口一次只执行一张任务卡。
- 未经项目负责人明确允许，不生成下一张施工任务卡。
- 前端/产品/视觉任务必须由项目负责人看效果后才能进入下一步。
- 不要丢弃任何当前未提交改动。
- 不要修改 config.toml。
- 不要打印 secret/token/API key。

当前状态摘要：
- 分支 main，本地领先 origin/main 3 个提交。
- 当前工作区有一批未提交的前端和流程文档改动。
- RM-0007 / RM-0007-R1 报告页改动基本完成。
- RM-0008 首页单栏分步骤改造已完成一版，但项目负责人反馈首页太长，上传区和岗位描述区太大，底部提醒不该做成卡片。
- 鼠标滚轮关键词滚动问题据测试和人工反馈基本可用。
- 本地页面验收规则：优先运行 npm run dev，打开 http://localhost:3000/ 和 http://localhost:3000/result；npm run build 用于确定性验证；next start 的本地产物错误单独处理。

下一步：
先汇总 RM-0008-R1 首页首屏压缩返工需求，等待项目负责人确认是否可以生成任务卡。不要直接施工。

RM-0008-R1 返工方向：
- 让首页首屏尽量一眼看到完整流程。
- 上传区域缩小。
- 考虑将上传简历和岗位描述合并成一个紧凑主输入面板。
- 不要只写 JD；用“岗位描述 / 招聘要求 / 岗位职责和任职要求”等更易懂文案。
- 底部限制和 AI 提醒用一段轻量小字，不做卡片。
- 不做开屏动画，本轮暂缓。
```
