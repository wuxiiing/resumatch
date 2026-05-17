# ResuMatch Control Room Handoff - 2026-05-18

## Purpose

This handoff is for archiving the current Codex control-room thread and continuing ResuMatch in a fresh control-room session without relying on old chat context.

Do not treat this file as a completed checkpoint. It records the current dirty worktree and the next coordination step.

## Repo / Branch

- Repo path: `D:\AI-workspace\Codex\ResuMatch`
- Git root: `D:/AI-workspace/Codex/ResuMatch`
- Current branch: `main`
- Remote: `https://github.com/wuxiiing/resumatch.git`
- Branch state at handoff: `main...origin/main [ahead 3]`
- Latest commits:
  - `2421fa4 feat: scaffold frontend app shell`
  - `934b42e docs: add frontend design guide`
  - `1ed8f3b docs: add phase 0 workflow and handover docs`
  - `914498b chore: initialize resumatch project docs`

## Current Worktree State

At handoff time, `git status --short --branch` showed:

```text
## main...origin/main [ahead 3]
 M FRONTEND_DESIGN_GUIDE.md
 M PROJECT_WORKFLOW.md
 M app/globals.css
 M app/page.tsx
 M app/result/page.tsx
 M components/FileUploader.tsx
 M components/HistorySidebar.tsx
 M components/JDInput.tsx
 M components/Logo.tsx
 M components/ReportViewer.tsx
 M components/ScoreDashboard.tsx
 M components/SummarySidebar.tsx
 M lib/mock-report.ts
 M types/analysis.ts
?? docs/
```

`git diff --stat` before this handoff file was added:

```text
14 files changed, 498 insertions(+), 176 deletions(-)
```

Git also prints LF-to-CRLF warnings for many modified files. Treat that as line-ending noise unless the diff unexpectedly balloons.

## Current Goal

Finish the front-end first-phase refinement before moving to backend work.

The current immediate task is **RM-0008-R1: Homepage first-viewport compression and copy refinement**.

The homepage was converted to a single-column step flow, but project-owner visual review found it too tall and too card-heavy. The owner wants users to see the whole core flow at a glance:

- Logo
- Short product explanation
- Resume upload
- Job description / recruitment requirement input
- Start analysis button
- One lightweight reminder sentence

## What Has Been Completed

### Stable Completed Work

- Stage 0 docs and workflow were committed.
- Front-end design guide was committed.
- Stage 1 Next.js + Tailwind front-end shell was committed.

### Current Uncommitted Completed Work

- RM-0007 report page layout rework:
  - Report score summary moved toward a top full-width overview style.
  - Report legend moved out as a separate element.
  - Report detail and sidebar structure adjusted.

- RM-0007-R1 report page refinement:
  - Right sidebar first card changed from duplicate overall comment to `岗位方向`.
  - Added static `jobDirection` placeholder data.
  - Added suggestion descriptions.
  - Hid visible horizontal keyword scrollbar.
  - Kept keyword horizontal scroll through wheel/pointer interaction.

- RM-0008 homepage first pass:
  - Homepage changed from two-column placeholder to single-column step layout.
  - Added history entry, large logo, upload section, job-description section, start button, and reminder cards.
  - Removed development-facing homepage text such as stage placeholder / no parsing / no API / no Word generation.

- Workflow documentation updates:
  - Added wrong-window guard.
  - Added control-room proposal / acceptance rules.
  - Added task-card layering:
    - construction card
    - acceptance card
    - checkpoint card
  - Added local page acceptance rule:
    - use `npm run dev`
    - open `http://localhost:3000/`
    - open `http://localhost:3000/result`
    - use `npm run build` for deterministic build validation
    - treat `next start` errors as separate production-preview issues

## Current Front-End Feedback

Project-owner homepage feedback:

1. Homepage became a long page; this is not ideal.
2. User should be able to see the full core flow at first glance.
3. Resume upload is too large for a simple file upload control.
4. Consider merging upload and job-description input into one compact main panel.
5. Do not rely on the abbreviation `JD`; many users do not know what it means.
6. Use clearer text such as:
   - `目标岗位描述`
   - `招聘要求`
   - `岗位职责和任职要求`
7. Bottom reminder should be one lightweight sentence, not cards.
8. Keyword wheel behavior on report page appeared usable; do not rework it unless acceptance finds a concrete issue.

## Task Card Already Generated For Front-End Window

The following short construction task card was generated and can be sent to the front-end construction window:

```text
任务卡编号：RM-0008-R1
施工窗口：前端施工窗口
任务名称：首页首屏压缩与文案返工

你是 ResuMatch 项目的前端施工窗口，不是总控室，不是产品经理。

只执行本任务卡。
不要丢弃、reset、revert、discard 当前已有改动。
不要修改项目管理文档。
不要修改后端/API/DeepSeek/文件解析/Word 导出/限流相关代码。
不要新增登录、付费、PDF 导出、一键改写等范围外功能。
不要做开屏动画。

背景：
当前首页已经改成单栏分步骤结构，但项目负责人视觉验收后认为：
1. 首页变成了大长页，用户不能一眼看见完整信息。
2. 上传简历区域太大，它只是上传文件，不应该占这么多首屏空间。
3. 上传简历和岗位描述输入可以考虑合并到一个紧凑主输入面板里。
4. 不要直接只写 JD，很多用户不知道 JD 是什么意思，应使用更清楚的中文文案。
5. 底部提醒不需要做成卡片，用一段轻量小字即可。

任务目标：
把首页压缩成更紧凑的一屏工具入口，让用户打开首页时尽量一眼看到完整流程：
- Logo
- 标题和一句说明
- 上传简历
- 粘贴岗位描述 / 招聘要求
- 开始分析按钮
- 轻量提醒文字

修改要求：
1. 保留单栏居中方向，但减少纵向高度。
2. 将上传简历和岗位描述输入整合成一个紧凑主输入面板，或视觉上合并成一个连续输入区域。
3. 上传区缩小：
   - 不要大面积空白。
   - 可以保留虚线上传区域，但高度明显降低。
   - 文件状态也要更紧凑。
4. 岗位输入文案优化：
   - 标题不要只写 JD。
   - 建议用：粘贴目标岗位描述、粘贴招聘要求、岗位职责和任职要求 等更易懂表达。
   - 可以在辅助文案里解释：JD 指招聘页面里的岗位职责、任职要求和加分项。
5. 开始分析按钮要保持清晰，但不要把页面撑长。
6. 底部提醒改为一段轻量小字，不要做成卡片：
   - 每个 IP 每日最多分析 5 次。
   - 本报告为 AI 辅助参考，非专业建议。
7. 在当前桌面视口下，首页核心流程应尽量一屏可见，不需要用户明显向下滚动才能理解完整流程。
8. 保持白底、细边框、青蓝强调、专业工具感。
9. 移动端不能横向溢出，文字不能重叠。

允许修改范围：
- app/page.tsx
- components/FileUploader.tsx
- components/JDInput.tsx
- components/Logo.tsx

如确实需要，可少量修改：
- app/globals.css

禁止修改范围：
- PROJECT_SCOPE.md
- PROJECT_WORKFLOW.md
- FRONTEND_DESIGN_GUIDE.md
- TASKS.md
- app/result/page.tsx
- components/ScoreDashboard.tsx
- 后端/API/解析/DeepSeek/导出/限流相关文件
- package 依赖文件

最低验证：
- npm run lint
- npm run build

请打开本地页面检查：
- http://localhost:3000/

重点看：
1. 首页是否不再像大长页。
2. 上传区是否明显变小。
3. 上传和岗位描述是否更像一个紧凑完整的输入流程。
4. 是否避免只写 JD 导致用户不理解。
5. 底部提醒是否不再是卡片。
6. 桌面视口下是否尽量一屏看到完整核心流程。
7. 移动端是否无横向溢出。

完成后回传：
施工窗口：前端施工窗口
任务名称：RM-0008-R1 首页首屏压缩与文案返工
完成情况：完成 / 部分完成 / 未完成

改动文件：
首页改了什么：
运行验证：
本地页面检查：
未运行验证：
是否有范围外功能：
风险或未完成项：
建议下一步：
```

## Commands / Checks Recently Run

Current control-room checks:

- `git status --short --branch`
- `git diff --stat`
- `git diff --name-status`
- `git log --oneline --decorate -5`

Testing window previously reported for RM-0008:

- `npm run lint`: passed
- `npm run build`: passed
- Build generated `/` and `/result` static routes
- Dev server HTTP checks for `/` and `/result`: 200

Control room also opened the local dev page:

- `http://localhost:3000/`

## Known Errors / Warnings / Risks

- Old front-end construction window failed during context compaction; its file edits were already written to disk.
- Codex in-app browser / localhost tooling can be flaky or blocked.
- Use `npm run dev` and `localhost:3000` for visual review.
- Do not rely on stale `localhost:3003`; no service was listening there when checked.
- A testing window reported `next start` production-preview error: `Cannot find module './833.js'`. Treat this as a separate production-preview / local `.next` artifact issue unless it reproduces after clean build/start.
- `docs/` is currently untracked because handoff files were created there.
- No checkpoint commit has been made for the current dirty worktree.

## User Preferences And Constraints

- User wants this chat/new chat to act as the project control room.
- Control room should not directly write business code.
- Control room may write project/process/handoff docs when explicitly asked.
- Construction work should happen in named construction windows.
- Front-end/product/visual work requires owner visual review before moving on.
- Do not generate new construction task cards unless the user explicitly says to.
- Use shorter construction cards; move heavy audit to acceptance/checkpoint cards.
- Do not discard, reset, revert, or restore current worktree changes unless explicitly requested.
- Do not modify `config.toml`.
- Do not print or commit secrets/tokens/API keys.
- Desktop path for local handoff files is `E:\桌面`.
- Opening/logo animation is remembered, but not part of RM-0008-R1. Confirm later after homepage structure is stable.

## Do-Not-Touch Areas Unless Explicitly Tasked

- Backend/API routes
- DeepSeek integration
- Resume parsing
- OCR
- Rate limiting
- Real Word export
- Login/register
- Payment
- PDF export
- In-page resume editing
- One-click rewrite/polish
- Package dependency files, unless the task explicitly requires it

## Next Steps

1. Open a new Codex control-room window.
2. Paste the reactivation prompt below.
3. In the new control room, verify current repo status.
4. Send the already-generated RM-0008-R1 construction card to the front-end construction window.
5. Wait for front-end window completion report.
6. Send a focused acceptance card to the testing window.
7. Have the owner visually inspect `http://localhost:3000/`.
8. Only after owner approval, prepare a checkpoint review and commit.

## Reactivation Prompt

Copy this into the new Codex session:

```text
你现在是 ResuMatch 项目的核心总控窗口，不是施工窗口。

项目路径：
D:\AI-workspace\Codex\ResuMatch

请先只读接手，不要修改业务代码，不要 reset / revert / discard / restore，不要 stage，不要 commit。

先检查：
1. git rev-parse --show-toplevel
2. git status --short --branch
3. git diff --name-status
4. git diff --stat

请读取 handoff：
docs/codex-handoffs/2026-05-18-resumatch-control-room-handoff.md

核心规则：
- 这是总控窗口，只做规划、任务卡、风险提醒、验收、checkpoint 决策。
- 业务代码交给命名施工窗口。
- 未经项目负责人明确允许，不生成下一张施工任务卡。
- 不要丢弃当前未提交改动。
- 不要修改 config.toml。
- 不要打印 secret/token/API key。
- 前端视觉任务必须由项目负责人看页面后才能进入下一步。

当前状态：
- main 分支，本地领先 origin/main 3 个提交。
- 当前工作区有一批未提交的前端和流程文档改动。
- RM-0007 / RM-0007-R1 报告页基本完成。
- RM-0008 首页单栏版已做一版，但项目负责人认为首页太长、上传区域太大、底部提醒不应做成卡片。
- 已经生成 RM-0008-R1 短版前端施工任务卡，内容在 handoff 文件里。

下一步：
等项目负责人确认后，把 RM-0008-R1 任务卡发给前端施工窗口。
不要自己施工。

本地页面查看规则：
- 优先运行 npm run dev。
- 打开 http://localhost:3000/ 和 http://localhost:3000/result。
- 不要误用 stale localhost:3003。
- npm run build 用于确定性验证。
- next start 的本地产物错误单独记录，不直接当作源码坏了。
```
