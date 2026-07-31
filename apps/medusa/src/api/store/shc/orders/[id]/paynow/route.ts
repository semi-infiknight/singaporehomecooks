import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import {
  getAuthContext,
  requireCustomerId,
  unauthorized,
} from "../../../../../../lib/shc-actors";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import {
  createHitPayPayNowRequest,
  hitpayConfigured,
  qrPayloadToDataUrl,
} from "../../../../../../lib/shc-hitpay";

/**
 * POST /store/shc/orders/:id/paynow
 * Create HitPay PayNow embedded QR for this order (customer JWT).
 * HitPay is the only customer payment path — no manual "I've paid".
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: orderId } = req.params as { id: string };
  const auth = getAuthContext(req);
  if (!auth || auth.actor_type !== "customer") {
    return unauthorized(res, "Customer login required for PayNow");
  }

  let customerId: string;
  try {
    const cid = requireCustomerId(req);
    if (!cid) return unauthorized(res, "Customer login required");
    customerId = String(cid);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(orderId);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
  }
  const m = data.meta as any;
  if (m.customer_id && String(m.customer_id).length > 0 && m.customer_id !== customerId) {
    return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Not your order") });
  }

  const status = String(m.shc_status || "");
  if (status === "cart") {
    return res.status(400).json({
      error: createSHCError(
        "SHC-ORDER-003",
        "Pay only after the cook has confirmed your order"
      ),
    });
  }
  if (["paid", "preparing", "ready_for_collection", "collected", "completed"].includes(status)) {
    return res.json({
      provider: "already_paid",
      order_id: orderId,
      shc_status: status,
      paynow_reference: m.paynow_reference || null,
    });
  }

  if (status !== "accepted") {
    return res.status(400).json({
      error: createSHCError("SHC-ORDER-003", "Order is not ready for payment"),
    });
  }

  let amountDollars = 0;
  if (m.total_cents != null && Number(m.total_cents) > 0) {
    amountDollars = Number(m.total_cents) / 100;
  } else if (m.total != null && Number(m.total) > 0) {
    amountDollars = Number(m.total);
  }
  if (amountDollars <= 0) {
    return res.status(400).json({
      error: createSHCError("SHC-PAY-001", "Order has no payable total"),
    });
  }

  const uen =
    process.env.SHC_PLATFORM_UEN?.trim() ||
    process.env.PAYNOW_UEN?.trim() ||
    "UEN-PENDING";
  const displayName =
    process.env.SHC_PLATFORM_LEGAL_NAME?.trim() ||
    process.env.PAYNOW_DISPLAY_NAME?.trim() ||
    "Singapore Home Cooks";

  if (!hitpayConfigured()) {
    return res.status(503).json({
      error: createSHCError("SHC-PAY-002", "PayNow unavailable (HITPAY_API_KEY not configured)"),
      provider: "hitpay_unconfigured",
      order_id: orderId,
    });
  }

  try {
    const created = await createHitPayPayNowRequest({
      amountDollars,
      referenceNumber: orderId,
      purpose: `SHC order ${orderId}`,
      name: auth.actor_type === "customer" ? "Customer" : undefined,
    });

    // Stash HitPay id in paynow_reference prefix so webhook can match (until dedicated column)
    const stashRef = `HP:${created.payment_request_id}`;
    await metaService.createOrUpdateMeta({
      order_id: orderId,
      paynow_reference: stashRef,
    } as any).catch(() => null);

    const qr_image_data_url = created.qr_payload
      ? await qrPayloadToDataUrl(created.qr_payload)
      : null;

    return res.json({
      provider: "hitpay",
      order_id: orderId,
      amount: amountDollars,
      currency: "SGD",
      reference: orderId,
      uen,
      display_name: displayName,
      payment_request_id: created.payment_request_id,
      checkout_url: created.checkout_url,
      qr_payload: created.qr_payload,
      qr_image_data_url,
      status: created.status,
    });
  } catch (e: any) {
    return res.status(502).json({
      error: createSHCError("SHC-PAY-001", e?.message || "HitPay create failed"),
      provider: "hitpay_error",
      order_id: orderId,
      amount: amountDollars,
      reference: orderId,
      uen,
      display_name: displayName,
    });
  }
}
