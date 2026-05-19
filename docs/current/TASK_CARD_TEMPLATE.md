# Task Card Template

Use this short format for new construction windows. One task card should target one named window only.

```text
施工窗口：前端施工窗口 / 后端施工窗口 / QA窗口 / Git-checkpoint窗口 / 文档窗口
任务名：RM-xxxx xxx

先读：
- AGENTS.md
- docs/current/PROJECT_STATE.md
- docs/current/TASK_CARD_TEMPLATE.md

目标：
一句话说明要完成什么。

允许改：
- 只列允许修改的文件或目录。

禁止读：
- IMPLEMENTATION_LOG.md
- FRONTEND_DESIGN_GUIDE.md
- project_handover_resumatch.md
- docs/codex-handoffs/*
- docs/archive/*
除非本任务明确要求查历史。

禁止改：
- 列出禁止修改的文件或目录。
- 不提交，不 push。
- 不打印真实 API Key、完整简历、完整 JD、完整模型原始响应。

验收：
- npm run lint
- npm run build
- 写 1-3 条任务相关检查。

低 token：
- 只读相关文件。
- 日志最多看最后 80 行。
- 不粘贴完整命令输出。
- 回传只写结论和必要摘要。

回传：
- 改动文件：
- 原因：
- 验证：
- 风险或未完成项：
```

Rules:

- Do not give one card to multiple construction windows.
- Keep allowed files narrow.
- If a task crosses scope, stop and report instead of adapting silently.
- Product experience is confirmed by the owner.
- The control room handles sequencing and checkpoints.
