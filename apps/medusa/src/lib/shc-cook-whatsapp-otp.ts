import { Redis } from "ioredis";
import {
  generateWhatsappOtpCode,
  maskWhatsappMobile,
  sendWhatsappOtpMessage,
  shouldAllowDemoWhatsappOtp,
} from "./shc-meta-whatsapp";

const TTL_SEC = 60 * 15;
const KEY_PREFIX = "shc:cook:whatsapp:otp:";

export type CookWhatsappOtpScope = "register" | "mobile_verify";

type PendingOtp = { code: string; expiresAt: number };

const memory = new Map<string, PendingOtp>();

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

function storageKey(scope: CookWhatsappOtpScope, id: string) {
  return `${KEY_PREFIX}${scope}:${id}`;
}

function scopeId(scope: CookWhatsappOtpScope, mobileE164: string, cookId?: string) {
  if (scope === "register") return mobileE164;
  if (!cookId) throw new Error("cookId required for mobile_verify OTP");
  return `${cookId}:${mobileE164}`;
}

async function storeOtp(key: string, code: string) {
  const r = await getRedis();
  if (r) {
    await r.setex(key, TTL_SEC, code);
    return;
  }
  memory.set(key, { code, expiresAt: Date.now() + TTL_SEC * 1000 });
}

async function readOtp(key: string): Promise<string | null> {
  const r = await getRedis();
  if (r) return r.get(key);
  const pending = memory.get(key);
  if (!pending) return null;
  if (pending.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return pending.code;
}

async function deleteOtp(key: string) {
  const r = await getRedis();
  if (r) {
    await r.del(key);
    return;
  }
  memory.delete(key);
}

export async function issueCookWhatsappOtp(
  scope: CookWhatsappOtpScope,
  mobileE164: string,
  cookId?: string
): Promise<{
  delivered: boolean;
  channel: "whatsapp" | "demo";
  hint: string;
  mobile_masked: string;
}> {
  const id = scopeId(scope, mobileE164, cookId);
  const key = storageKey(scope, id);
  const code = generateWhatsappOtpCode();
  await storeOtp(key, code);

  const { delivered, channel } = await sendWhatsappOtpMessage(mobileE164, code);
  const mobile_masked = maskWhatsappMobile(mobileE164);
  const hint = delivered
    ? `We sent a 6-digit code to WhatsApp ${mobile_masked}.`
    : shouldAllowDemoWhatsappOtp()
      ? `Enter code ${code} to verify (demo — WhatsApp delivery not configured).`
      : "Could not deliver WhatsApp code. Try again shortly.";

  return { delivered, channel, hint, mobile_masked };
}

export async function verifyCookWhatsappOtp(
  scope: CookWhatsappOtpScope,
  mobileE164: string,
  code: string,
  cookId?: string
): Promise<boolean> {
  const id = scopeId(scope, mobileE164, cookId);
  const key = storageKey(scope, id);
  const trimmed = code.trim();
  const stored = await readOtp(key);
  return Boolean(stored && stored === trimmed);
}

export async function clearCookWhatsappOtp(
  scope: CookWhatsappOtpScope,
  mobileE164: string,
  cookId?: string
): Promise<void> {
  const id = scopeId(scope, mobileE164, cookId);
  await deleteOtp(storageKey(scope, id));
}
