/**
 * HitPay PayNow (embedded QR) — server-only.
 * Docs: POST /v1/payment-requests with generate_qr + paynow_online
 * Webhook: HMAC-SHA256 of raw body with salt → Hitpay-Signature
 */
import crypto from "crypto";

export type HitPayCreateResult = {
  payment_request_id: string;
  amount: string;
  currency: string;
  status: string;
  reference_number: string;
  checkout_url: string | null;
  /** EMV PayNow string (prod) or sandbox URL */
  qr_payload: string | null;
  raw: Record<string, unknown>;
};

export function hitpayConfigured(): boolean {
  return Boolean(process.env.HITPAY_API_KEY?.trim());
}

export function hitpayBaseUrl(): string {
  const explicit = process.env.HITPAY_API_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const env = (process.env.HITPAY_ENV || process.env.NODE_ENV || "").toLowerCase();
  if (env === "production" || env === "live" || process.env.HITPAY_LIVE === "1") {
    return "https://api.hit-pay.com/v1";
  }
  return "https://api.sandbox.hit-pay.com/v1";
}

export function hitpaySalt(): string {
  return (
    process.env.HITPAY_WEBHOOK_SALT?.trim() ||
    process.env.HITPAY_SALT?.trim() ||
    ""
  );
}

/**
 * Validate HitPay webhook signature (Hitpay-Signature header).
 * Computes HMAC-SHA256 hex of the raw body string with salt.
 */
export function verifyHitPayWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined | null,
  salt = hitpaySalt()
): { ok: boolean; reason?: string } {
  if (!salt) return { ok: false, reason: "HITPAY_WEBHOOK_SALT not set" };
  if (!signatureHeader?.trim()) return { ok: false, reason: "missing Hitpay-Signature" };
  const payload = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = crypto.createHmac("sha256", salt).update(payload, "utf8").digest("hex");
  const got = signatureHeader.trim().toLowerCase();
  const exp = expected.toLowerCase();
  try {
    const a = Buffer.from(got, "utf8");
    const b = Buffer.from(exp, "utf8");
    if (a.length !== b.length) return { ok: false, reason: "signature mismatch" };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: "signature mismatch" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "signature compare failed" };
  }
}

export async function createHitPayPayNowRequest(input: {
  amountDollars: number;
  referenceNumber: string;
  purpose?: string;
  name?: string;
  email?: string;
}): Promise<HitPayCreateResult> {
  const apiKey = process.env.HITPAY_API_KEY?.trim();
  if (!apiKey) throw new Error("HITPAY_API_KEY not configured");

  const amount = Number(input.amountDollars);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount for HitPay");

  const amountStr = amount.toFixed(2);
  const body = new URLSearchParams();
  body.set("amount", amountStr);
  body.set("currency", "sgd");
  body.append("payment_methods[]", "paynow_online");
  body.set("generate_qr", "true");
  body.set("reference_number", input.referenceNumber.slice(0, 120));
  if (input.purpose) body.set("purpose", input.purpose.slice(0, 200));
  if (input.name) body.set("name", input.name.slice(0, 120));
  if (input.email) body.set("email", input.email.slice(0, 120));

  const res = await fetch(`${hitpayBaseUrl()}/payment-requests`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(`HitPay create failed: ${msg}`);
  }

  const qr =
    json?.qr_code_data?.qr_code ||
    json?.qr_code ||
    json?.qrCodeData?.qrCode ||
    null;

  return {
    payment_request_id: String(json.id || ""),
    amount: String(json.amount || amountStr),
    currency: String(json.currency || "sgd"),
    status: String(json.status || "pending"),
    reference_number: String(json.reference_number || input.referenceNumber),
    checkout_url: json.url ? String(json.url) : null,
    qr_payload: qr ? String(qr) : null,
    raw: json,
  };
}

export type HitPayPaymentRequestRow = {
  id: string
  amount: string
  currency: string
  status: string
  reference_number: string | null
  purpose: string | null
  checkout_url: string | null
  payment_methods: string[]
  created_at: string | null
  updated_at: string | null
}

export type HitPayListResult = {
  data: HitPayPaymentRequestRow[]
  total: number
  current_page: number
  per_page: number
  last_page: number
  raw_meta?: Record<string, unknown>
}

/** List payment requests from HitPay (sandbox or live via Railway env). */
export async function listHitPayPaymentRequests(opts?: {
  perPage?: number
  page?: number
}): Promise<HitPayListResult> {
  const apiKey = process.env.HITPAY_API_KEY?.trim()
  if (!apiKey) throw new Error("HITPAY_API_KEY not configured")

  const perPage = Math.min(Math.max(opts?.perPage ?? 25, 1), 100)
  const page = Math.max(opts?.page ?? 1, 1)
  const qs = new URLSearchParams({
    per_page: String(perPage),
    current_page: String(page),
  })

  const res = await fetch(`${hitpayBaseUrl()}/payment-requests?${qs}`, {
    method: "GET",
    headers: {
      "X-BUSINESS-API-KEY": apiKey,
      "X-Requested-With": "XMLHttpRequest",
    },
  })
  const text = await res.text()
  let json: any = {}
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 400) }
  }
  if (!res.ok) {
    const msg = json?.message || json?.error || text.slice(0, 200) || `HTTP ${res.status}`
    throw new Error(`HitPay list failed: ${msg}`)
  }

  const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
  const meta = json?.meta || {}
  return {
    data: rows.map((r: any) => ({
      id: String(r.id || ""),
      amount: String(r.amount ?? "0"),
      currency: String(r.currency || "sgd"),
      status: String(r.status || "unknown"),
      reference_number: r.reference_number != null ? String(r.reference_number) : null,
      purpose: r.purpose != null ? String(r.purpose) : null,
      checkout_url: r.url ? String(r.url) : null,
      payment_methods: Array.isArray(r.payment_methods)
        ? r.payment_methods.map(String)
        : [],
      created_at: r.created_at ? String(r.created_at) : null,
      updated_at: r.updated_at ? String(r.updated_at) : null,
    })),
    total: Number(meta.total ?? rows.length) || rows.length,
    current_page: Number(meta.current_page ?? page) || page,
    per_page: Number(meta.per_page ?? perPage) || perPage,
    last_page: Number(meta.last_page ?? 1) || 1,
    raw_meta: meta,
  }
}

export function hitpayEnvLabel(): "sandbox" | "live" {
  const env = (process.env.HITPAY_ENV || "").toLowerCase()
  if (env === "production" || env === "live" || process.env.HITPAY_LIVE === "1") {
    return "live"
  }
  return "sandbox"
}

/** Encode qr_payload as a PNG data URL for clients (no native QR lib). */
export async function qrPayloadToDataUrl(payload: string, size = 280): Promise<string | null> {
  if (!payload) return null;
  try {
    // Dynamic import — optional dep; fallback null if missing
    const QRCode = await import("qrcode").then((m) => m.default || m);
    const dataUrl = await (QRCode as any).toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      type: "image/png",
    });
    return typeof dataUrl === "string" ? dataUrl : null;
  } catch {
    return null;
  }
}
