type RateLimitReason = "ip" | "site";

type RateLimitAllowed = {
  ok: true;
  dayKey: string;
  ipCount: number;
  siteCount: number;
};

type RateLimitBlocked = {
  ok: false;
  reason: RateLimitReason;
  status: 429 | 503;
  error: string;
  dayKey: string;
  ipCount: number;
  siteCount: number;
};

export type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

export type MemoryRateLimiterOptions = {
  ipDailyLimit: number;
  siteDailyLimit: number;
  now?: () => Date;
};

type DailyBucket = {
  dayKey: string;
  siteCount: number;
  ipCounts: Map<string, number>;
};

const BEIJING_TIME_ZONE = "Asia/Shanghai";
const DEFAULT_IP_DAILY_LIMIT = 5;
const DEFAULT_SITE_DAILY_LIMIT = 500;
const LOCAL_IP_FALLBACK = "unknown/local";

function getBeijingDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BEIJING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

export function createMemoryRateLimiter(options: MemoryRateLimiterOptions) {
  let bucket: DailyBucket = {
    dayKey: getBeijingDayKey(options.now?.() ?? new Date()),
    siteCount: 0,
    ipCounts: new Map<string, number>()
  };

  function getBucket(now: Date): DailyBucket {
    const dayKey = getBeijingDayKey(now);

    if (bucket.dayKey !== dayKey) {
      bucket = {
        dayKey,
        siteCount: 0,
        ipCounts: new Map<string, number>()
      };
    }

    return bucket;
  }

  return {
    consume(ip: string): RateLimitResult {
      const currentBucket = getBucket(options.now?.() ?? new Date());
      const normalizedIp = ip.trim() || LOCAL_IP_FALLBACK;
      const ipCount = currentBucket.ipCounts.get(normalizedIp) ?? 0;

      if (currentBucket.siteCount >= options.siteDailyLimit) {
        return {
          ok: false,
          reason: "site",
          status: 503,
          error: "今日全站分析次数已达上限，请明天再试。",
          dayKey: currentBucket.dayKey,
          ipCount,
          siteCount: currentBucket.siteCount
        };
      }

      if (ipCount >= options.ipDailyLimit) {
        return {
          ok: false,
          reason: "ip",
          status: 429,
          error: "今日最多分析 5 次，请明天再试。",
          dayKey: currentBucket.dayKey,
          ipCount,
          siteCount: currentBucket.siteCount
        };
      }

      const nextIpCount = ipCount + 1;
      const nextSiteCount = currentBucket.siteCount + 1;

      currentBucket.ipCounts.set(normalizedIp, nextIpCount);
      currentBucket.siteCount = nextSiteCount;

      return {
        ok: true,
        dayKey: currentBucket.dayKey,
        ipCount: nextIpCount,
        siteCount: nextSiteCount
      };
    }
  };
}

// MVP memory limiter: Beijing natural-day boundary. Counts reset on process restart
// and are not shared across multiple instances; later this can be replaced with Vercel KV.
const analyzeRateLimiter = createMemoryRateLimiter({
  ipDailyLimit: DEFAULT_IP_DAILY_LIMIT,
  siteDailyLimit: DEFAULT_SITE_DAILY_LIMIT
});

export function getAnalyzeRateLimitClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || LOCAL_IP_FALLBACK;
}

export function consumeAnalyzeRateLimit(ip: string): RateLimitResult {
  return analyzeRateLimiter.consume(ip);
}

// ─── 2.0 各功能限额（复用上面的内存限额器；生产化同样换 KV）──────────────
export type AgentAction = "analyze" | "resume" | "career" | "recon" | "edit";

const AGENT_LIMITS: Record<AgentAction, number> = {
  analyze: 5, // 岗位研判（4 次 DeepSeek，最贵）
  resume: 2, // 简历解析（上传）
  career: 20, // 和小简聊天（每条消息一次，放宽）
  recon: 5, // 公司背调（联网搜）
  edit: 5 // 简历导出
};

const AGENT_LABEL: Record<AgentAction, string> = {
  analyze: "岗位研判",
  resume: "简历解析",
  career: "和小简聊天",
  recon: "公司背调",
  edit: "简历导出"
};

const agentLimiters: Record<AgentAction, ReturnType<typeof createMemoryRateLimiter>> = {
  analyze: createMemoryRateLimiter({ ipDailyLimit: AGENT_LIMITS.analyze, siteDailyLimit: 500 }),
  resume: createMemoryRateLimiter({ ipDailyLimit: AGENT_LIMITS.resume, siteDailyLimit: 300 }),
  career: createMemoryRateLimiter({ ipDailyLimit: AGENT_LIMITS.career, siteDailyLimit: 2000 }),
  recon: createMemoryRateLimiter({ ipDailyLimit: AGENT_LIMITS.recon, siteDailyLimit: 300 }),
  edit: createMemoryRateLimiter({ ipDailyLimit: AGENT_LIMITS.edit, siteDailyLimit: 500 })
};

// 给 2.0 各 API 用：取 IP → 计数 → 超限给带功能名的文案。
export function consumeAgentLimit(action: AgentAction, headers: Headers): RateLimitResult {
  const ip = getAnalyzeRateLimitClientIp(headers);
  const r = agentLimiters[action].consume(ip);
  if (!r.ok) {
    const label = AGENT_LABEL[action];
    const error =
      r.reason === "site"
        ? `今天全站「${label}」太火爆了，明天再来。`
        : `今天「${label}」的免费次数（${AGENT_LIMITS[action]} 次/天）用完了，明天再来。`;
    return { ...r, error };
  }
  return r;
}
