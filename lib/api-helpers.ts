// API route 样板 helper：JSON POST 模式（parse body → 信用点 → env key → handler → 日志）。
// 文件上传、Tavily 多步管道路由自行处理限流。

import { NextResponse } from "next/server";
import { consumeCredits, recordFail, type CreditAction } from "./rate-limit";
import { log } from "./logger";

export interface ApiPostOpts {
  /** 信用点操作类型（决定扣多少点 + 硬上限） */
  credit?: CreditAction;
  /** single env var that must be set */
  requireKey?: string;
  /** route label for logging (auto-derived from URL if omitted) */
  route?: string;
}

function apiPath(req: Request): string {
  try { return new URL(req.url).pathname; } catch { return "/api/unknown"; }
}

export function apiPost(
  opts: ApiPostOpts,
  handler: (body: Record<string, unknown>, req: Request) => Promise<unknown>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    const route = opts.route ?? apiPath(req);
    const t0 = Date.now();

    // 1. JSON parse
    let body: Record<string, unknown>;
    try {
      const raw = await req.text();
      body = JSON.parse(raw) as Record<string, unknown>;
      log.info(route, "request", { reqSize: raw.length });
    } catch {
      log.warn(route, "invalid JSON body");
      return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
    }

    // 2. 信用点 + 防刷
    if (opts.credit) {
      const r = consumeCredits(opts.credit, req.headers);
      if (!r.ok) {
        log.warn(route, `blocked: ${r.reason}`, { status: r.status });
        if (r.reason === "rate") recordFail(req.headers);
        return NextResponse.json({ error: r.error }, { status: r.status });
      }
    }

    // 3. Env key
    if (opts.requireKey && !process.env[opts.requireKey]) {
      log.error(route, `missing env: ${opts.requireKey}`, null, { status: 500 });
      return NextResponse.json({ error: `服务未配置 ${opts.requireKey}。` }, { status: 500 });
    }

    // 4. Handler
    try {
      const result = await handler(body, req);
      log.info(route, "ok", { duration: Date.now() - t0, status: 200 });
      return NextResponse.json(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "处理失败，请重试。";
      log.error(route, msg, e, { duration: Date.now() - t0, status: 500 });
      recordFail(req.headers);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}
