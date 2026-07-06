// 简配 · 限额与信用点系统
// 三层防线：信用点(25/天) → 操作硬上限 → 全站熔断
// 内存计数，生产多实例需换 Vercel KV

type RateLimitReason = "ip" | "site" | "credits" | "rate";

type RateLimitAllowed = {
  ok: true;
  dayKey: string;
  ipCount: number;
  siteCount: number;
  creditsLeft?: number;
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

// ─── 北京日期 ───
const BEIJING_TZ = "Asia/Shanghai";
const LOCAL_IP_FALLBACK = "unknown/local";

function getBeijingDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BEIJING_TZ, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || LOCAL_IP_FALLBACK;
}

// ─── 内存计数器 ───
type DailyBucket = { dayKey: string; siteCount: number; ipCounts: Map<string, number> };

function createMemoryLimiter(siteDailyLimit: number) {
  let bucket: DailyBucket = { dayKey: getBeijingDayKey(new Date()), siteCount: 0, ipCounts: new Map() };

  function getBucket(now: Date): DailyBucket {
    const dk = getBeijingDayKey(now);
    if (bucket.dayKey !== dk) bucket = { dayKey: dk, siteCount: 0, ipCounts: new Map() };
    return bucket;
  }

  return {
    check(ip: string, max: number, now?: Date): RateLimitResult {
      const b = getBucket(now ?? new Date());
      const nIp = ip.trim() || LOCAL_IP_FALLBACK;
      const c = b.ipCounts.get(nIp) ?? 0;

      if (b.siteCount >= siteDailyLimit) {
        return { ok: false, reason: "site", status: 503, error: "今日全站太火爆，明天再来。", dayKey: b.dayKey, ipCount: c, siteCount: b.siteCount };
      }
      if (c >= max) {
        return { ok: false, reason: "ip", status: 429, error: "", dayKey: b.dayKey, ipCount: c, siteCount: b.siteCount };
      }

      b.ipCounts.set(nIp, c + 1);
      b.siteCount += 1;
      return { ok: true, dayKey: b.dayKey, ipCount: c + 1, siteCount: b.siteCount };
    },

    /** 只查询不消耗 */
    peek(ip: string): number {
      const b = getBucket(new Date());
      return b.ipCounts.get(ip.trim() || LOCAL_IP_FALLBACK) ?? 0;
    }
  };
}

// ─── 信用点系统 ───
const DAILY_CREDITS = 25;

type CreditAction =
  | "analyze"     // 研判 ①②③④
  | "chat"        // 军师/小简对话
  | "image"       // 图片简历 OCR
  | "career"      // 方向校准 / 路径推演
  | "recon"       // 背调 / 岗位调查
  | "structure"   // 简历结构化整理
  | "intake"      // 文字分诊
  | "parse"       // 简历解析（pdf/docx 等）
  | "export";     // 导出

const CREDIT_COSTS: Record<CreditAction, number> = {
  analyze: 5,
  chat: 1,
  image: 2,
  career: 2,
  recon: 2,
  structure: 1,
  intake: 0,
  parse: 0,
  export: 0,
};

const CREDIT_LABELS: Record<CreditAction, string> = {
  analyze: "岗位研判", chat: "军师对话", image: "图片解析", career: "职业规划",
  recon: "背调调查", structure: "简历整理", intake: "文字识别", parse: "简历解析", export: "导出",
};

// 操作硬上限（不再限制——用户自己分配 25 点，爱全花在研判也行）
const HARD_CAPS: Partial<Record<CreditAction, number>> = {};

// 全站限额
const SITE_LIMITS: Record<CreditAction, number> = {
  analyze: 500, chat: 3000, image: 1000, career: 1000,
  recon: 300, structure: 500, intake: 1000, parse: 1000, export: 500,
};

// 最小请求间隔（毫秒），防脚本刷
const MIN_INTERVAL_MS = 2000;
const ipLastRequest = new Map<string, number>();

// 连续失败冻结（3次失败 → 冻结 1 小时）
const MAX_CONSECUTIVE_FAILS = 3;
const FREEZE_DURATION_MS = 60 * 60 * 1000;
const ipFailCount = new Map<string, { count: number; frozenUntil: number }>();

// ─── 各功能独立计数器 ───
const creditLimiter = createMemoryLimiter(999999); // 信用点自己算
const perActionLimiters: Record<string, ReturnType<typeof createMemoryLimiter>> = {};

function getActionLimiter(action: CreditAction) {
  if (!perActionLimiters[action]) {
    perActionLimiters[action] = createMemoryLimiter(SITE_LIMITS[action]);
  }
  return perActionLimiters[action];
}

// ─── 公开 API ───

export type { CreditAction };

export const CREDIT_INFO = { daily: DAILY_CREDITS, costs: CREDIT_COSTS, labels: CREDIT_LABELS, hardCaps: HARD_CAPS };

/** 检查并消耗信用点。返回 { ok, creditsLeft?, error? } */
export function consumeCredits(
  action: CreditAction,
  headers: Headers
): RateLimitResult {
  if (process.env.RATE_LIMIT_BYPASS === "1") {
    return { ok: true, dayKey: "bypass", ipCount: 0, siteCount: 0, creditsLeft: 999 };
  }

  const ip = getClientIp(headers);
  const now = Date.now();

  // 0. 连续失败冻结检查
  const fails = ipFailCount.get(ip);
  if (fails && fails.frozenUntil > now) {
    return { ok: false, reason: "rate", status: 429, error: "检测到异常请求，已临时限制访问，请 1 小时后再试。", dayKey: "", ipCount: 0, siteCount: 0 };
  }

  // 1. 最小间隔
  const last = ipLastRequest.get(ip) ?? 0;
  if (now - last < MIN_INTERVAL_MS) {
    return { ok: false, reason: "rate", status: 429, error: "请求太频繁，请稍后再试。", dayKey: "", ipCount: 0, siteCount: 0 };
  }
  ipLastRequest.set(ip, now);

  const cost = CREDIT_COSTS[action];
  const hardCap = HARD_CAPS[action];
  const label = CREDIT_LABELS[action];

  // 2. 信用点检查（免费操作跳过）
  if (cost > 0) {
    const cap = getDailyCap(ip);
    const used = creditLimiter.peek(ip);
    if (used + cost > cap) {
      return { ok: false, reason: "credits", status: 429, error: `余额不足：${label}需要 ${cost} 点，你只剩 ${cap - used} 点（今日共 ${cap} 点）。`, dayKey: "", ipCount: used, siteCount: 0 };
    }
    // 消耗信用点（扣 cost 次计数）
    for (let i = 0; i < cost; i++) creditLimiter.check(ip, cap);
  }

  // 3. 操作硬上限
  if (hardCap) {
    const r = getActionLimiter(action).check(ip, hardCap);
    if (!r.ok) {
      return { ...r, error: `今天「${label}」已达上限（${hardCap} 次/天），明天再来。` };
    }
  }

  // 4. 全站熔断由各 limiter 的 site 上限自动处理（check 时已累计 siteCount）

  const usedAfter = creditLimiter.peek(ip);
  const cap = getDailyCap(ip);
  return { ok: true, dayKey: getBeijingDayKey(new Date()), ipCount: usedAfter, siteCount: 0, creditsLeft: cap - usedAfter };
}

/** 记录失败（用于冻结检测） */
export function recordFail(headers: Headers): void {
  const ip = getClientIp(headers);
  const f = ipFailCount.get(ip) ?? { count: 0, frozenUntil: 0 };
  f.count += 1;
  if (f.count >= MAX_CONSECUTIVE_FAILS) {
    f.frozenUntil = Date.now() + FREEZE_DURATION_MS;
  }
  ipFailCount.set(ip, f);
}

/** 获取当前 IP 剩余信用点 */
export function getCreditsLeft(headers: Headers): { used: number; left: number; daily: number; claimed: boolean } {
  if (process.env.RATE_LIMIT_BYPASS === "1") return { used: 0, left: 999, daily: 999, claimed: true };
  const ip = getClientIp(headers);
  const used = creditLimiter.peek(ip);
  const cap = getDailyCap(ip);
  return { used, left: Math.max(0, cap - used), daily: cap, claimed: isClaimed(ip) };
}

// ─── 每日免费加点 ───
const FREE_BONUS = 10;
const claimedBonus = new Map<string, string>(); // ip → dayKey

function isClaimed(ip: string): boolean {
  return claimedBonus.get(ip) === getBeijingDayKey(new Date());
}

function getDailyCap(ip: string): number {
  return DAILY_CREDITS + (isClaimed(ip) ? FREE_BONUS : 0);
}

/** 领取每日免费点数。返回 { ok, daily, error? } */
export function claimFreeCredits(headers: Headers): { ok: boolean; daily: number; error?: string } {
  if (process.env.RATE_LIMIT_BYPASS === "1") return { ok: true, daily: 999 };
  const ip = getClientIp(headers);
  if (isClaimed(ip)) return { ok: false, daily: DAILY_CREDITS, error: "今天已经领过了，明天再来。" };
  claimedBonus.set(ip, getBeijingDayKey(new Date()));
  return { ok: true, daily: DAILY_CREDITS + FREE_BONUS };
}
