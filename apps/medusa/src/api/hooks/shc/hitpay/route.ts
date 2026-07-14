import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { verifyHitPayWebhookSignature } from "../../../../lib/shc-hitpay";
import { markOrderPaid } from "../../../../lib/shc-mark-order-paid";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcTiffinModuleService from "../../../../modules/shc-tiffin/service";
import { parseTiffinRechargeHitPayReference } from "../../../../lib/shc-tiffin-recharge-hitpay";

/**
 * POST /hooks/shc/hitpay
 * HitPay event webhooks:
 *  - payment_request.completed (reference_number = SHC order id)
 *  - charge.created / charge.updated (status succeeded; reference via payment_request)
 *
 * Signature: Hitpay-Signature = HMAC-SHA256(raw body, per-webhook salt)
 * Register salt from webhook detail in dashboard → HITPAY_WEBHOOK_SALT on Railway.
 */
function extractOrderId(body: any, headers: Record<string, any>): {
  orderId: string;
  paymentId: string;
  status: string;
  amount: string;
} {
  const eventObject = String(
    headers["hitpay-event-object"] || headers["Hitpay-Event-Object"] || ""
  ).toLowerCase();
  const eventType = String(
    headers["hitpay-event-type"] || headers["Hitpay-Event-Type"] || ""
  ).toLowerCase();

  // payment_request.completed style
  let orderId = String(body.reference_number || body.reference || "").trim();
  let paymentId = String(body.id || "").trim();
  let status = String(body.status || "").toLowerCase();
  let amount = String(body.amount ?? "");

  // Nested payment_request on charge
  const pr = body.payment_request || body.paymentRequest;
  if (!orderId && pr) {
    orderId = String(pr.reference_number || pr.reference || "").trim();
    if (!paymentId && pr.id) paymentId = String(pr.id);
  }
  if (!orderId && body.payment_request_id) {
    // only payment request id — not order id
  }
  if (!orderId && body.remark && /^SHC-/.test(String(body.remark))) {
    orderId = String(body.remark).trim();
  }

  // charge.created: status often "succeeded"
  if (eventObject === "charge" || body.payment_provider) {
    status = String(body.status || status).toLowerCase();
    amount = String(body.amount ?? amount);
    paymentId = String(body.id || paymentId);
  }

  // Treat created/succeeded as paid for charge events
  if (eventType === "created" && (status === "succeeded" || status === "completed" || !status)) {
    status = status || "succeeded";
  }

  return { orderId, paymentId, status, amount };
}

function isPaidStatus(status: string): boolean {
  const s = status.toLowerCase();
  return (
    !s ||
    s === "completed" ||
    s === "succeeded" ||
    s === "paid" ||
    s === "success"
  );
}

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
  const { orderId, paymentId, status, amount } = extractOrderId(body, req.headers as any);

  if (status && !isPaidStatus(status)) {
    return res.status(200).json({ ok: true, ignored: true, status });
  }

  if (!orderId) {
    return res.status(200).json({
      ok: false,
      reason: "missing order reference_number (set when creating payment request)",
    });
  }

  const tiffinRecharge = parseTiffinRechargeHitPayReference(orderId);
  if (tiffinRecharge) {
    const paynowRef = paymentId
      ? `HP:${paymentId}`
      : `HITPAY-TRECH-${Date.now().toString(36)}`;
    try {
      const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
      const result = await tiffin.rechargeSubscription(tiffinRecharge.customerId, tiffinRecharge.weeks, {
        paynowRef,
      });
      return res.status(200).json({
        ok: true,
        tiffin_recharge: true,
        customer_id: tiffinRecharge.customerId,
        weeks: tiffinRecharge.weeks,
        subscription_id: (result as any)?.id || null,
        paynow_reference: paynowRef,
      });
    } catch (e: any) {
      return res.status(400).json({
        error: createSHCError("SHC-PAY-001", e?.message || "Tiffin recharge failed"),
      });
    }
  }

  try {
    const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
    const data = await metaService.getOrderMetaWithMessages(orderId);
    if (!data.meta) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
    }
  } catch {
    /* continue */
  }

  const paynowRef = paymentId
    ? `HP:${paymentId}`
    : `HITPAY-${orderId}-${Date.now().toString(36)}`;

  try {
    const result = await markOrderPaid(req.scope, {
      order_id: orderId,
      paynow_reference: paynowRef,
      actor: "hitpay-webhook",
      notes: `HitPay webhook payment=${paymentId} amount=${amount}`,
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

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    ok: true,
    hook: "hitpay",
    events: ["charge.created", "charge.updated", "payment_request.completed"],
    registered_note:
      "Webhook registered via HitPay API. Use per-webhook salt for Hitpay-Signature (dashboard webhook detail).",
  });
}
