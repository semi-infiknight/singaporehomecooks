import { randomBytes } from "crypto";
import { Redis } from "ioredis";
import { normalizePaynowMobile } from "@shc/utils";
import {
  buildCookVerifyWhatsAppUrl,
  formatVerifyPrefillMessage,
  generateWhatsappOtpCode,
  maskWhatsappMobile,
  parseVerifyPrefillMessage,
  sendWhatsappSessionText,
  shouldAllowDemoWhatsappOtp,
} from "./shc-meta-whatsapp";
import { readRegisterOtpForMobile, storeRegisterOtpForMobile } from "./shc-cook-whatsapp-otp";

const TTL_SEC = 60 * 15;
const SESSION_PREFIX = "shc:cook:whatsapp:verify-session:";

export type CookWhatsappVerifySession = {
  mobileE164: string;
  createdAt: number;
  messagedAt?: number;
  waFrom?: string;
};

const memory = new Map<string, CookWhatsappVerifySession>();

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

function sessionKey(token: string) {
  return `${SESSION_PREFIX}${token}`;
}

function newVerifyToken(): string {
  return randomBytes(5).toString("hex");
}

async function saveSession(token: string, session: CookWhatsappVerifySession) {
  const payload = JSON.stringify(session);
  const r = await getRedis();
  if (r) {
    await r.setex(sessionKey(token), TTL_SEC, payload);
    return;
  }
  memory.set(token, session);
}

async function loadSession(token: string): Promise<CookWhatsappVerifySession | null> {
  const r = await getRedis();
  if (r) {
    const raw = await r.get(sessionKey(token));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CookWhatsappVerifySession;
    } catch {
      return null;
    }
  }
  const session = memory.get(token);
  if (!session) return null;
  if (session.createdAt + TTL_SEC * 1000 < Date.now()) {
    memory.delete(token);
    return null;
  }
  return session;
}

function waIdToE164(waFrom: string): string | null {
  const digits = waFrom.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("65") && digits.length === 10) return `+${digits}`;
  if (digits.length === 8) return `+65${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/** Start cook signup WhatsApp verify — user must message us via wa.me deep link. */
export async function prepareCookRegisterWhatsappVerify(mobileInput: string): Promise<{
  verify_token: string;
  whatsapp_url: string;
  prefill_message: string;
  hint: string;
  mobile_masked: string;
  demo_code?: string;
  otp_ready: boolean;
}> {
  const mobileE164 = normalizePaynowMobile(mobileInput);
  if (!mobileE164) {
    throw new Error("Invalid Singapore mobile number");
  }

  const verify_token = newVerifyToken();
  const prefill_message = formatVerifyPrefillMessage(verify_token);
  const whatsapp_url = buildCookVerifyWhatsAppUrl(prefill_message);
  const mobile_masked = maskWhatsappMobile(mobileE164);

  await saveSession(verify_token, {
    mobileE164,
    createdAt: Date.now(),
  });

  if (shouldAllowDemoWhatsappOtp()) {
    const demo_code = generateWhatsappOtpCode();
    await storeRegisterOtpForMobile(mobileE164, demo_code);
    return {
      verify_token,
      whatsapp_url,
      prefill_message,
      mobile_masked,
      demo_code,
      otp_ready: true,
      hint: `Tap Message us to verify and send the pre-filled WhatsApp message. Demo code: ${demo_code}`,
    };
  }

  return {
    verify_token,
    whatsapp_url,
    prefill_message,
    mobile_masked,
    otp_ready: false,
    hint: `Tap Message us to verify, send the pre-filled WhatsApp message, then enter the code we reply with.`,
  };
}

/** Meta webhook: user messaged us — reply with OTP in the free 24h session window. */
export async function handleInboundCookRegisterVerifyMessage(
  waFrom: string,
  messageText: string
): Promise<{ handled: boolean; replied: boolean }> {
  const token = parseVerifyPrefillMessage(messageText);
  if (!token) return { handled: false, replied: false };

  const session = await loadSession(token);
  if (!session) {
    await sendWhatsappSessionText(
      waFrom,
      "This verification link has expired. Go back to the SHC app and tap Message us to verify again."
    ).catch(() => null);
    return { handled: true, replied: true };
  }

  const inboundE164 = waIdToE164(waFrom);
  if (inboundE164 && inboundE164 !== session.mobileE164) {
    const expected = normalizePaynowMobile(session.mobileE164);
    const got = normalizePaynowMobile(inboundE164);
    if (expected && got && expected !== got) {
      await sendWhatsappSessionText(
        waFrom,
        "Please verify using the same WhatsApp number you entered in the SHC app."
      ).catch(() => null);
      return { handled: true, replied: true };
    }
  }

  const code = generateWhatsappOtpCode();
  await storeRegisterOtpForMobile(session.mobileE164, code);
  await saveSession(token, {
    ...session,
    messagedAt: Date.now(),
    waFrom,
  });

  await sendWhatsappSessionText(
    waFrom,
    `Your Singapore Home Cooks verification code is ${code}. It expires in 15 minutes. Enter it in the app to finish creating your account.`
  );

  return { handled: true, replied: true };
}

export async function isCookRegisterOtpReady(mobileInput: string): Promise<boolean> {
  const mobileE164 = normalizePaynowMobile(mobileInput);
  if (!mobileE164) return false;
  const stored = await readRegisterOtpForMobile(mobileE164);
  return Boolean(stored);
}
