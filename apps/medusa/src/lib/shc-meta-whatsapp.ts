const DEMO_OTP = "123456";
const DEFAULT_GRAPH_VERSION = "v22.0";
const DEFAULT_TEMPLATE_LANG = "en";
const VERIFY_PREFIX = "SHC-VERIFY";

export function formatVerifyPrefillMessage(token: string): string {
  return `${VERIFY_PREFIX} ${token}`;
}

export function parseVerifyPrefillMessage(text: string): string | null {
  const match = String(text || "").match(new RegExp(`${VERIFY_PREFIX}\\s+([a-f0-9]{8,16})`, "i"));
  return match?.[1]?.toLowerCase() || null;
}

export function getWhatsAppBusinessWaMePhone(): string | null {
  const raw =
    process.env.WHATSAPP_BUSINESS_WA_ME_PHONE?.trim() ||
    process.env.WHATSAPP_BUSINESS_DISPLAY_PHONE?.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits || null;
}

export function buildCookVerifyWhatsAppUrl(prefillMessage: string): string {
  const phone = getWhatsAppBusinessWaMePhone();
  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(prefillMessage)}`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(prefillMessage)}`;
}

export function isMetaWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

function otpTemplateName(): string | null {
  const name = process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim();
  return name || null;
}

/** Demo OTP when Meta WhatsApp Cloud API is not configured (local dev, Maestro). */
export function shouldAllowDemoWhatsappOtp(): boolean {
  if (process.env.SHC_ALLOW_DEMO_OTP === "1") return true;
  if (!isMetaWhatsAppConfigured() && process.env.NODE_ENV !== "production") return true;
  return false;
}

export function generateWhatsappOtpCode(): string {
  const forced = process.env.SHC_COOK_REGISTER_DEMO_OTP?.trim();
  if (forced) return forced;
  if (shouldAllowDemoWhatsappOtp()) return DEMO_OTP;
  return String(Math.floor(100000 + Math.random() * 900000));
}

function graphApiVersion(): string {
  return process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
}

function toWhatsAppRecipient(mobileE164: string): string {
  return mobileE164.replace(/\D/g, "");
}

function buildOtpTemplatePayload(code: string) {
  const templateName = otpTemplateName();
  if (!templateName) {
    throw new Error("WHATSAPP_OTP_TEMPLATE_NAME is required for Meta WhatsApp OTP delivery");
  }
  const language = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE?.trim() || DEFAULT_TEMPLATE_LANG;
  const buttonStyle = process.env.WHATSAPP_OTP_BUTTON_STYLE?.trim() || "copy_code";

  const components: Array<Record<string, unknown>> = [
    {
      type: "body",
      parameters: [{ type: "text", text: code }],
    },
  ];

  if (buttonStyle === "url") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: code }],
    });
  } else {
    components.push({
      type: "button",
      sub_type: "copy_code",
      index: "0",
      parameters: [{ type: "payload", payload: code }],
    });
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  };
}

/** Send a verification code via Meta WhatsApp Cloud API (Graph). */
export async function sendWhatsappOtpMessage(
  mobileE164: string,
  code: string
): Promise<{ delivered: boolean; channel: "whatsapp" | "demo" }> {
  if (!isMetaWhatsAppConfigured()) {
    if (shouldAllowDemoWhatsappOtp()) {
      return { delivered: false, channel: "demo" };
    }
    throw new Error("WhatsApp verification is not configured");
  }

  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN!.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const url = `https://graph.facebook.com/${graphApiVersion()}/${phoneNumberId}/messages`;

  const payload = {
    ...buildOtpTemplatePayload(code),
    to: toWhatsAppRecipient(mobileE164),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = `WhatsApp send failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string; error_user_msg?: string } };
      message = body.error?.error_user_msg || body.error?.message || message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  return { delivered: true, channel: "whatsapp" };
}

/** Reply inside the 24h customer service window (free — user messaged first). */
export async function sendWhatsappSessionText(waRecipientId: string, body: string): Promise<void> {
  if (!isMetaWhatsAppConfigured()) {
    if (shouldAllowDemoWhatsappOtp()) return;
    throw new Error("WhatsApp verification is not configured");
  }

  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN!.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const url = `https://graph.facebook.com/${graphApiVersion()}/${phoneNumberId}/messages`;
  const to = waRecipientId.replace(/\D/g, "");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  if (!res.ok) {
    let message = `WhatsApp session reply failed (${res.status})`;
    try {
      const parsed = (await res.json()) as { error?: { message?: string; error_user_msg?: string } };
      message = parsed.error?.error_user_msg || parsed.error?.message || message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
}

export function maskWhatsappMobile(mobileE164: string): string {
  const digits = mobileE164.replace(/\D/g, "");
  if (digits.length < 4) return mobileE164;
  return `+${digits.slice(0, 2)}****${digits.slice(-4)}`;
}
