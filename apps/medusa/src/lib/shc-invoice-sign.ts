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

/** Signed bulk corporate invoice ZIP (mobile Linking.openURL). */
export function signCorporateInvoicesDownload(input: {
  customer_id: string;
  from?: string;
  to?: string;
  exp?: number;
}): { exp: number; sig: string } {
  const exp = input.exp ?? Math.floor(Date.now() / 1000) + DEFAULT_TTL_SEC;
  const payload = `corporate|${input.customer_id}|${input.from || ""}|${input.to || ""}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return { exp, sig };
}

export function verifyCorporateInvoicesDownload(input: {
  customer_id: string;
  from?: string;
  to?: string;
  exp: string | number;
  sig: string;
}): { ok: true } | { ok: false; reason: string } {
  const expN = Number(input.exp);
  if (!Number.isFinite(expN) || expN < 1) return { ok: false, reason: "invalid exp" };
  if (expN < Math.floor(Date.now() / 1000)) return { ok: false, reason: "link expired" };
  if (!input.customer_id?.trim()) return { ok: false, reason: "missing customer_id" };
  if (!input.sig || !/^[a-f0-9]{32,}$/i.test(input.sig)) return { ok: false, reason: "invalid sig" };

  const payload = `corporate|${input.customer_id}|${input.from || ""}|${input.to || ""}|${expN}`;
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
  return { ok: true };
}

export function buildCorporateInvoicesDownloadUrl(input: {
  customer_id: string;
  from?: string;
  to?: string;
}): { download_url: string; expires_at: string; expires_in: number; filename: string; mime: string } {
  const { exp, sig } = signCorporateInvoicesDownload(input);
  const q = new URLSearchParams({
    customer_id: input.customer_id,
    exp: String(exp),
    sig,
  });
  if (input.from) q.set("from", input.from);
  if (input.to) q.set("to", input.to);
  const stamp = input.from && input.to ? `${input.from}_${input.to}` : new Date().toISOString().slice(0, 10);
  return {
    download_url: `${medusaPublicBase()}/hooks/shc/corporate-invoices?${q.toString()}`,
    expires_at: new Date(exp * 1000).toISOString(),
    expires_in: Math.max(0, exp - Math.floor(Date.now() / 1000)),
    filename: `shc-corporate-invoices-${stamp}.zip`,
    mime: "application/zip",
  };
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

export function signPayoutInvoiceDownload(input: {
  batch_id: string;
  cook_id: string;
  exp?: number;
}): { exp: number; sig: string } {
  const exp = input.exp ?? Math.floor(Date.now() / 1000) + DEFAULT_TTL_SEC;
  const payload = `payout|${input.batch_id}|${input.cook_id}|${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return { exp, sig };
}

export function verifyPayoutInvoiceDownload(input: {
  batch_id: string;
  cook_id: string;
  exp: string | number;
  sig: string;
}): { ok: true } | { ok: false; reason: string } {
  const expN = Number(input.exp);
  if (!Number.isFinite(expN) || expN < 1) return { ok: false, reason: "invalid exp" };
  if (expN < Math.floor(Date.now() / 1000)) return { ok: false, reason: "link expired" };
  if (!input.batch_id?.trim() || !input.cook_id?.trim()) return { ok: false, reason: "missing ids" };
  if (!input.sig || !/^[a-f0-9]{32,}$/i.test(input.sig)) return { ok: false, reason: "invalid sig" };

  const payload = `payout|${input.batch_id}|${input.cook_id}|${expN}`;
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
  return { ok: true };
}

export function buildPayoutInvoiceDownloadUrl(input: {
  batch_id: string;
  cook_id: string;
}): { download_url: string; expires_at: string; expires_in: number; filename: string; mime: string } {
  const { exp, sig } = signPayoutInvoiceDownload(input);
  const q = new URLSearchParams({
    batch_id: input.batch_id,
    cook_id: input.cook_id,
    exp: String(exp),
    sig,
  });
  return {
    download_url: `${medusaPublicBase()}/hooks/shc/payout-invoice?${q.toString()}`,
    expires_at: new Date(exp * 1000).toISOString(),
    expires_in: Math.max(0, exp - Math.floor(Date.now() / 1000)),
    filename: `payout-${input.batch_id}.pdf`,
    mime: "application/pdf",
  };
}
