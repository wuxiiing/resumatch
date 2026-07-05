// 本地研判历史（浏览器 localStorage，存多条、可重开）。BUILD-PLAN 阶段 4 的本地版。
// 不上账号、不上服务端；同一浏览器内持久。

import { AGENT_REPORT_KEY, type AgentReport } from "@/lib/agent-report";

export type HistoryItem = { id: string; label: string; date: string; createdAt: number; report: AgentReport };

const HISTORY_KEY = "jianpei:history";
const MAX = 20;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    if (!Array.isArray(arr)) return [];
    // 按创建时间降序稳定排序(重看不改变位置);旧数据缺 createdAt 时用 date 估算回填。
    return arr
      .map((it) => ({ ...it, createdAt: it.createdAt ?? (Date.parse(it.date) || 0) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// 在研判页加载时调用：把当前研判存进历史（同岗位+同日去重，限 MAX 条）。
// 重存保留原 createdAt，所以重看一条不会改变它在列表里的位置（按创建时间稳定排序）。
export function saveToHistory(report: AgentReport): void {
  try {
    const label = [report.meta.company, report.meta.position].filter(Boolean).join(" · ") || "未命名研判";
    const id = `${label}|${report.meta.date}`;
    const prev = loadHistory();
    const existing = prev.find((it) => it.id === id);
    const rest = prev.filter((it) => it.id !== id);
    const item: HistoryItem = { id, label, date: report.meta.date, createdAt: existing?.createdAt ?? Date.now(), report };
    const next = [item, ...rest].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* 存不下不影响主流程 */
  }
}

// 删除一条历史,返回删除后的列表(给组件直接 setState 用)。
export function removeFromHistory(id: string): HistoryItem[] {
  try {
    const list = loadHistory().filter((it) => it.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    return list;
  } catch {
    return loadHistory();
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
