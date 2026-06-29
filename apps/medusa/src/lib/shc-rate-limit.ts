import type { MedusaRequest } from "@medusajs/framework/http";

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

export function getRateLimitKey(req: MedusaRequest, scope: string) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  const remote = (req as any).ip || (req as any).socket?.remoteAddress || "unknown";
  return `${scope}:${ip || remote}`;
}

export function checkRateLimit(key: string, options: { max: number; windowMs: number }) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs };
  }

  if (current.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: options.max - current.count, resetAt: current.resetAt };
}
