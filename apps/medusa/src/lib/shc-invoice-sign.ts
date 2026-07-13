/**
 * Short-lived signed invoice download links (no JWT / no publishable key header).
 * Used so mobile can Linking.openURL() a real application/pdf without native FS.
 */
import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SEC = 10 * 60; // 10 minutes

function secret(): string {
  const s =
    process.env.SHC_INVOICE_SIGN_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.COOKIE_SECRET?.trim() ||
    "";
  if (!s) {
    throw new Error("No signing secret (set JWT_SECRET or SHC_INVOICE_SIGN_SECRET)");
  }
  return s;
}

export type InvoiceLinkAudience = "customer" | "cook";

export function signInvoiceDownload(input: {
  order_id: string;
  audience: InvoiceLinkAudience;
  exp?: number; // unix seconds
}): { exp: number; sig: string } {
  const exp = input.exp ?? Math.floor(Date.now() / 1000) + DEFAULT_TTL_SEC;
  const payload = `${input.order_id}|${input.audience}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return { exp, sig };
}

export function verifyInvoiceDownload(input: {
  order_id: string;
  audience: string;
  exp: string | number;
  sig: string;
}): { ok: true; audience: InvoiceLinkAudience } | { ok: false; reason: string } {
  const expN = Number(input.exp);
  if (!Number.isFinite(expN) || expN < 1) return { ok: false, reason: "invalid exp" };
  if (expN < Math.floor(Date.now() / 1000)) return { ok: false, reason: "link expired" };
  const aud = input.audience === "cook" ? "cook" : input.audience === "customer" ? "customer" : null;
  if (!aud) return { ok: false, reason: "invalid audience" };
  if (!input.sig || !/^[a-f0-9]{32,}$/i.test(input.sig)) return { ok: false, reason: "invalid sig" };

  const payload = `${input.order_id}|${aud}|${expN}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(input.sig).toLowerCase(), "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "bad signature" };
    }
  } catch {
    return { ok: false, reason: "bad signature" };
  }
  return { ok: true, audience: aud };
}

/** Absolute public base for medusa (no trailing slash). */
export function medusaPublicBase(): string {
  const raw =
    process.env.MEDUSA_PUBLIC_URL?.trim() ||
    process.env.MEDUSA_BACKEND_URL?.trim() ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.replace(/^https?:\/\//, "")}`
      : "");
  return raw.replace(/\/$/, "") || "https://medusa-production-d2ba.up.railway.app";
}

export function buildInvoiceDownloadUrl(input: {
  order_id: string;
  audience: InvoiceLinkAudience;
}): { download_url: string; expires_at: string; expires_in: number } {
  const { exp, sig } = signInvoiceDownload(input);
  const q = new URLSearchParams({
    order_id: input.order_id,
    audience: input.audience,
    exp: String(exp),
    sig,
  });
  return {
    download_url: `${medusaPublicBase()}/hooks/shc/invoice?${q.toString()}`,
    expires_at: new Date(exp * 1000).toISOString(),
    expires_in: Math.max(0, exp - Math.floor(Date.now() / 1000)),
  };
}
