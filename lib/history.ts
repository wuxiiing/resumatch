// 本地研判历史（浏览器 localStorage，存多条、可重开）。BUILD-PLAN 阶段 4 的本地版。
// 不上账号、不上服务端；同一浏览器内持久。

import { AGENT_REPORT_KEY, type AgentReport } from "@/lib/agent-report";

export type HistoryItem = { id: string; label: string; date: string; report: AgentReport };

const HISTORY_KEY = "jianpei:history";
const MAX = 20;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// 在研判页加载时调用：把当前研判存进历史（同岗位+同日去重，置顶，限 MAX 条）。
export function saveToHistory(report: AgentReport): void {
  try {
    const label = [report.meta.company, report.meta.position].filter(Boolean).join(" · ") || "未命名研判";
    const id = `${label}|${report.meta.date}`;
    const list = loadHistory().filter((it) => it.id !== id);
    list.unshift({ id, label, date: report.meta.date, report });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* 存不下不影响主流程 */
  }
}

// 点历史项：把那次研判塞回 sessionStorage，跳到研判页重看。
export function openHistoryItem(item: HistoryItem): void {
  try {
    sessionStorage.setItem(AGENT_REPORT_KEY, JSON.stringify(item.report));
    window.location.href = "/agent-result";
  } catch {
    /* ignore */
  }
}
