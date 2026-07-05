// 本地研判历史（浏览器 localStorage，存多条、可重开）。BUILD-PLAN 阶段 4 的本地版。
// 不上账号、不上服务端；同一浏览器内持久。

import { AGENT_REPORT_KEY, JIANPEI_PROFILE_KEY, type AgentReport, type JianpeiProfile } from "@/lib/agent-report";

export type HistoryItem = { id: string; label: string; date: string; createdAt: number; resumeText: string; report: AgentReport };

const HISTORY_KEY = "jianpei:history";
const MAX = 20;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    if (!Array.isArray(arr)) return [];
    // 按创建时间降序稳定排序(重看不改变位置);旧数据缺 createdAt 时用 date 估算回填。
    return arr
      .map((it) => ({ ...it, createdAt: it.createdAt ?? (Date.parse(it.date) || 0), resumeText: it.resumeText ?? "" }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

// 研判 → 稳定 label / id（列表去重 + 简历绑定共用；只此一处，避免两边算法漂移）。
export function historyLabelOf(report: AgentReport): string {
  return [report.meta.company, report.meta.position].filter(Boolean).join(" · ") || "未命名研判";
}
export function historyIdOf(report: AgentReport): string {
  return `${historyLabelOf(report)}|${report.meta.date}`;
}

function currentProfileResumeText(): string {
  try {
    const p = localStorage.getItem(JIANPEI_PROFILE_KEY);
    return p ? (JSON.parse(p) as JianpeiProfile).resumeText ?? "" : "";
  } catch {
    return "";
  }
}

// 在研判页加载时调用：把当前研判存进历史（同岗位+同日去重，限 MAX 条）。
// 重存保留原 createdAt 与简历快照 → 重看一条不改变排序、也不覆盖它当初绑定的简历。
export function saveToHistory(report: AgentReport): void {
  try {
    const id = historyIdOf(report);
    const prev = loadHistory();
    const existing = prev.find((it) => it.id === id);
    const rest = prev.filter((it) => it.id !== id);
    // 简历原文快照：新研判抓当前档案的简历并冻结；重看旧研判保留原快照。
    const item: HistoryItem = {
      id,
      label: historyLabelOf(report),
      date: report.meta.date,
      createdAt: existing?.createdAt ?? Date.now(),
      resumeText: existing?.resumeText || currentProfileResumeText(),
      report,
    };
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
