import twilio from "twilio";

const DEMO_OTP = "123456";

export function isTwilioWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim()
  );
}

/** Demo OTP when Twilio is not configured (local dev, Maestro, staging). */
export function shouldAllowDemoWhatsappOtp(): boolean {
  if (process.env.SHC_ALLOW_DEMO_OTP === "1") return true;
  if (!isTwilioWhatsAppConfigured() && process.env.NODE_ENV !== "production") return true;
  return false;
}

export function generateWhatsappOtpCode(): string {
  const forced = process.env.SHC_COOK_REGISTER_DEMO_OTP?.trim();
  if (forced) return forced;
  if (shouldAllowDemoWhatsappOtp()) return DEMO_OTP;
  return String(Math.floor(100000 + Math.random() * 900000));
}

function whatsappAddress(e164: string): string {
  const trimmed = e164.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed.startsWith("+") ? trimmed : `+${trimmed}`}`;
}

/** Send a verification code via Twilio WhatsApp Business API. */
export async function sendWhatsappOtpMessage(
  mobileE164: string,
  code: string
): Promise<{ delivered: boolean; channel: "whatsapp" | "demo" }> {
  const body = `Your Singapore Home Cooks verification code is ${code}. It expires in 15 minutes.`;

  if (!isTwilioWhatsAppConfigured()) {
    if (shouldAllowDemoWhatsappOtp()) {
      return { delivered: false, channel: "demo" };
    }
    throw new Error("WhatsApp verification is not configured");
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: whatsappAddress(mobileE164),
    body,
  });
  return { delivered: true, channel: "whatsapp" };
}

export function maskWhatsappMobile(mobileE164: string): string {
  const digits = mobileE164.replace(/\D/g, "");
  if (digits.length < 4) return mobileE164;
  return `+${digits.slice(0, 2)}****${digits.slice(-4)}`;
}
