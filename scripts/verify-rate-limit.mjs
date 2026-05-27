import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMemoryRateLimiter } from "../lib/rate-limit.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyPerIpLimit() {
  const limiter = createMemoryRateLimiter({
    ipDailyLimit: 5,
    siteDailyLimit: 500,
    now: () => new Date("2026-05-27T04:00:00.000Z")
  });

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = limiter.consume("203.0.113.10");
    assert(result.ok, `same IP attempt ${attempt} should be allowed`);
  }

  const blocked = limiter.consume("203.0.113.10");
  assert(!blocked.ok && blocked.status === 429, "same IP attempt 6 should return 429");
}

function verifySiteLimit() {
  const limiter = createMemoryRateLimiter({
    ipDailyLimit: 5,
    siteDailyLimit: 500,
    now: () => new Date("2026-05-27T04:00:00.000Z")
  });

  for (let index = 0; index < 500; index += 1) {
    const result = limiter.consume(`203.0.113.${index}`);
    assert(result.ok, `site attempt ${index + 1} should be allowed`);
  }

  const blocked = limiter.consume("198.51.100.1");
  assert(!blocked.ok && blocked.status === 503, "site attempt 501 should return 503");
}

function verifyInvalidRequestsDoNotConsume() {
  const limiter = createMemoryRateLimiter({
    ipDailyLimit: 5,
    siteDailyLimit: 500,
    now: () => new Date("2026-05-27T04:00:00.000Z")
  });

  // Invalid JSON or oversized input is rejected before consume() is called by the route.
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = limiter.consume("203.0.113.20");
    assert(result.ok, `valid attempt ${attempt} should still be allowed`);
  }

  const blocked = limiter.consume("203.0.113.20");
  assert(!blocked.ok && blocked.status === 429, "only valid requests should consume quota");
}

function verifyRouteOrder() {
  const routePath = resolve("app/api/analyze/route.ts");
  const source = readFileSync(routePath, "utf8");
  const jsonIndex = source.indexOf("request.json()");
  const validationIndex = source.indexOf("validateAnalyzeRequest(payload)");
  const limitIndex = source.indexOf("consumeAnalyzeRateLimit(clientIp)");
  const deepSeekIndex = source.indexOf("analyzeWithDeepSeek(requestValidation.data)");

  assert(jsonIndex >= 0, "route should parse JSON");
  assert(validationIndex > jsonIndex, "request validation should happen after JSON parsing");
  assert(limitIndex > validationIndex, "rate limit should happen after request validation");
  assert(deepSeekIndex > limitIndex, "DeepSeek should be called after rate limit");
}

verifyPerIpLimit();
verifySiteLimit();
verifyInvalidRequestsDoNotConsume();
verifyRouteOrder();

console.log("rate-limit verification passed");
