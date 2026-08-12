import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Redis } from "ioredis";
import { createSHCError } from "@shc/types";

type Hit = { count: number; resetAt: number };

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

const memory = new Map<string, Hit>();
let redis: Redis | null | undefined;

async function getRedis(): Promise<Redis | null> {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    await client.connect();
    redis = client;
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

export function getRateLimitKey(req: MedusaRequest, scope: string) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  const remote = (req as any).ip || (req as any).socket?.remoteAddress || "unknown";
  return `${scope}:${ip || remote}`;
}

function checkRateLimitMemory(key: string, options: { max: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    memory.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.max - 1, resetAt, limit: options.max };
  }

  if (current.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt, limit: options.max };
  }

  current.count += 1;
  memory.set(key, current);
  return {
    allowed: true,
    remaining: options.max - current.count,
    resetAt: current.resetAt,
    limit: options.max,
  };
}

async function checkRateLimitRedis(
  key: string,
  options: { max: number; windowMs: number }
): Promise<RateLimitResult | null> {
  const r = await getRedis();
  if (!r) return null;

  const redisKey = `shc:rl:${key}`;
  const count = await r.incr(redisKey);
  if (count === 1) {
    await r.pexpire(redisKey, options.windowMs);
  }
  const ttlMs = await r.pttl(redisKey);
  const resetAt = Date.now() + (ttlMs > 0 ? ttlMs : options.windowMs);
  const allowed = count <= options.max;
  return {
    allowed,
    remaining: Math.max(0, options.max - count),
    resetAt,
    limit: options.max,
  };
}

export async function checkRateLimit(
  key: string,
  options: { max: number; windowMs: number }
): Promise<RateLimitResult> {
  const redisResult = await checkRateLimitRedis(key, options);
  if (redisResult) return redisResult;
  return checkRateLimitMemory(key, options);
}

export function setRateLimitHeaders(res: MedusaResponse, result: RateLimitResult) {
  if (typeof (res as any).setHeader !== "function") return;
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) {
    const retrySec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retrySec));
  }
}

function requestPath(req: MedusaRequest) {
  return String(req.originalUrl || req.url || "");
}

/** Tiered limits for /store/shc/* — auth login/register are not rate-limited (OTP testing / cook onboarding). */
export async function resolveStoreShcRateLimit(req: MedusaRequest): Promise<RateLimitResult> {
  const path = requestPath(req);

  // Skip login/register entirely — the old 5/15m and 10/1h caps blocked OTP verify during cook testing.
  if (path.includes("/auth/") && (path.includes("/login") || path.includes("/register"))) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt: Date.now() + 60_000,
      limit: Number.MAX_SAFE_INTEGER,
    };
  }
  if (path.includes("/ops/client-crash")) {
    return checkRateLimit(getRateLimitKey(req, "ops.client-crash"), { max: 20, windowMs: 60 * 60 * 1000 });
  }

  const perMin = Number(process.env.SHC_STORE_RATE_LIMIT_PER_MIN || 120);
  return checkRateLimit(getRateLimitKey(req, "store.shc"), { max: perMin, windowMs: 60 * 1000 });
}

export function rateLimitExceededMessage(_path: string) {
  return "Too many requests. Please slow down and try again.";
}

export function sendRateLimitResponse(req: MedusaRequest, res: MedusaResponse, result: RateLimitResult) {
  setRateLimitHeaders(res, result);
  const path = requestPath(req);
  return res.status(429).json({
    error: createSHCError("SHC-GENERIC-001", rateLimitExceededMessage(path)),
  });
}
