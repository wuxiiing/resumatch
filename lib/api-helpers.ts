// API route 样板 helper：抽掉各 /api/* route 里 15-20 行的重复 boilerplate。
// 只覆盖最常见的 JSON POST 模式（parse body → 限流 → env key → handler → catch）；
// 文件上传、Tavily 多步管道、MVP 老路由保持原样。

import { NextResponse } from "next/server";
import { consumeAgentLimit, type AgentAction } from "./rate-limit";

export interface ApiPostOpts {
  /** rate-limit bucket; omit to skip rate limiting */
  bucket?: AgentAction;
  /** single env var that must be set (most common: "DEEPSEEK_API_KEY") */
  requireKey?: string;
}

/**
 * 包裹一个 JSON POST handler，自动处理：
 *   1. JSON body 解析（解析失败 → 400）
 *   2. 限额检查（bucket 非空时；超额 → 429）
 *   3. 环境变量检查（requireKey 非空时；缺失 → 500）
 *   4. handler 异常 → 500
 *
 * handler 返回值直接传给 NextResponse.json()。
 */
export function apiPost(
  opts: ApiPostOpts,
  handler: (body: Record<string, unknown>, req: Request) => Promise<unknown>
): (req: Request) => Promise<NextResponse> {
  return async (req: Request) => {
    // 1. JSON parse
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "请求体必须是合法 JSON。" }, { status: 400 });
    }

    // 2. Rate limit
    if (opts.bucket) {
      const rl = consumeAgentLimit(opts.bucket, req.headers);
      if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: rl.status });
    }

    // 3. Env key
    if (opts.requireKey && !process.env[opts.requireKey]) {
      return NextResponse.json({ error: `服务未配置 ${opts.requireKey}。` }, { status: 500 });
    }

    // 4. Handler
    try {
      const result = await handler(body, req);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "处理失败，请重试。";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
