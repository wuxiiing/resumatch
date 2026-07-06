// 简配 · 结构化日志
// Vercel 生产环境自动收集 stdout/stderr → Logs 面板可搜。
// 格式：{ ts, level, route, msg, duration?, err? } 每行一条 JSON。

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  ts: string;       // ISO 时间戳
  level: LogLevel;
  route: string;    // API 路径（如 "/api/parse-resume"）
  msg: string;
  duration?: number; // 请求耗时 ms（API route 自动填）
  err?: string;      // 错误摘要——只放 message，不放 stack（Vercel 已有）
  reqSize?: number;  // 请求体大小（字节）
  status?: number;   // HTTP 状态码
}

function emit(entry: LogEntry): void {
  // Vercel Logs 按行解析，JSON 一行一条
  process.stdout.write(JSON.stringify(entry) + "\n");
}

function now(): string {
  return new Date().toISOString();
}

export const log = {
  info(route: string, msg: string, extra?: Partial<LogEntry>): void {
    emit({ ts: now(), level: "info", route, msg, ...extra });
  },
  warn(route: string, msg: string, extra?: Partial<LogEntry>): void {
    emit({ ts: now(), level: "warn", route, msg, ...extra });
  },
  error(route: string, msg: string, err?: unknown, extra?: Partial<LogEntry>): void {
    emit({
      ts: now(),
      level: "error",
      route,
      msg,
      err: err instanceof Error ? err.message : String(err ?? ""),
      ...extra,
    });
  },
};
