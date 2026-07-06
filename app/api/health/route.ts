// 健康检查：部署后一键确认所有外部服务是否可达。
// GET /api/health → { status: "ok"|"degraded"|"down", checks: {...} }

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CheckResult = { ok: boolean; latencyMs: number; error?: string };

async function ping(label: string, url: string, apiKey?: string): Promise<CheckResult> {
  if (!apiKey) return { ok: false, latencyMs: 0, error: `缺少环境变量` };
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    // 401/403 说明 key 有效（只是 HEAD 请求没有 body），200 也正常
    const ok = res.ok || res.status === 401 || res.status === 403;
    return { ok, latencyMs: Date.now() - t0, error: ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e instanceof Error ? e.message : "连接失败" };
  }
}

export async function GET() {
  const checks: Record<string, CheckResult> = {};

  // DeepSeek
  checks.deepseek = await ping(
    "DeepSeek",
    (process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com") + "/models",
    process.env.DEEPSEEK_API_KEY
  );

  // 豆包（火山方舟 Ark）
  checks.ark = await ping(
    "豆包(Ark)",
    (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3") + "/models",
    process.env.ARK_API_KEY
  );

  // Tavily
  if (process.env.TAVILY_API_KEY) {
    const t0 = Date.now();
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: "test", max_results: 1 }),
        signal: AbortSignal.timeout(8000),
      });
      checks.tavily = { ok: res.ok, latencyMs: Date.now() - t0, error: res.ok ? undefined : `HTTP ${res.status}` };
    } catch (e) {
      checks.tavily = { ok: false, latencyMs: Date.now() - t0, error: e instanceof Error ? e.message : "连接失败" };
    }
  } else {
    checks.tavily = { ok: false, latencyMs: 0, error: "缺少环境变量" };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const anyOk = Object.values(checks).some((c) => c.ok);

  return NextResponse.json({
    status: allOk ? "ok" : anyOk ? "degraded" : "down",
    checks,
  });
}
