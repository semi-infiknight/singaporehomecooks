import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { verifyHitPayWebhookSignature } from "../../../../lib/shc-hitpay";
import { markOrderPaid } from "../../../../lib/shc-mark-order-paid";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";

/**
 * POST /hooks/shc/hitpay
 * HitPay payment_request.completed webhook (no JWT).
 * Register in HitPay dashboard: Developers → Webhook Endpoints → this URL.
 *
 * Signature: Hitpay-Signature = HMAC-SHA256(raw body, HITPAY_WEBHOOK_SALT)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const raw =
    (req as any).rawBody ||
    (typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body || {}));

  const signature =
    (req.headers["hitpay-signature"] as string) ||
    (req.headers["Hitpay-Signature"] as string) ||
    (req.headers["x-hitpay-signature"] as string);

  // In sandbox without salt, allow if HITPAY_WEBHOOK_SKIP_VERIFY=1 (dev only)
  const skip =
    process.env.HITPAY_WEBHOOK_SKIP_VERIFY === "1" &&
    process.env.NODE_ENV !== "production";

  if (!skip) {
    const verified = verifyHitPayWebhookSignature(raw, signature);
    if (!verified.ok) {
      return res.status(401).json({
        error: createSHCError("SHC-PAY-001", `Invalid HitPay webhook: ${verified.reason}`),
      });
    }
  }

  const body = (typeof req.body === "object" && req.body ? req.body : {}) as any;
  const status = String(body.status || "").toLowerCase();
  const paymentRequestId = String(body.id || "").trim();
  const referenceNumber = String(body.reference_number || "").trim();

  if (status && status !== "completed") {
    return res.status(200).json({ ok: true, ignored: true, status });
  }

  // Prefer our order id from reference_number; fallback search by HP: stash
  let orderId = referenceNumber;
  if (!orderId && paymentRequestId) {
    // Cannot list-all easily — reference_number is required when we create
    return res.status(200).json({
      ok: false,
      reason: "missing reference_number (order id)",
    });
  }

  if (!orderId) {
    return res.status(400).json({ error: createSHCError("SHC-PAY-001", "No order reference") });
  }

  // Sanity: order exists
  try {
    const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
    const data = await metaService.getOrderMetaWithMessages(orderId);
    if (!data.meta) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
    }
  } catch {
    /* continue — mark paid may still work */
  }

  const paynowRef =
    paymentRequestId
      ? `HP:${paymentRequestId}`
      : `HITPAY-${orderId}-${Date.now().toString(36)}`;

  try {
    const result = await markOrderPaid(req.scope, {
      order_id: orderId,
      paynow_reference: paynowRef,
      actor: "hitpay-webhook",
      notes: `HitPay payment_request ${paymentRequestId} amount=${body.amount}`,
    });
    return res.status(200).json({
      ok: true,
      order_id: orderId,
      already_paid: !!result.already_paid,
      total_cents: result.total_cents,
    });
  } catch (e: any) {
    return res.status(400).json({
      error: createSHCError("SHC-PAY-001", e?.message || "Mark paid failed"),
    });
  }
}

/** Health / HitPay dashboard URL check */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    ok: true,
    hook: "hitpay",
    events: ["payment_request.completed"],
  });
}
