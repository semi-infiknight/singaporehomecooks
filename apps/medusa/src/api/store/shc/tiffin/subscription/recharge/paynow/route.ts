import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { tiffinRechargeAmountCents } from "@shc/business-rules";
import { getCustomerId, tiffinCustomerError } from "../../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../../modules/shc-tiffin/service";
import {
  createHitPayPayNowRequest,
  hitpayConfigured,
  qrPayloadToDataUrl,
} from "../../../../../../../lib/shc-hitpay";
import { tiffinRechargeHitPayReference } from "../../../../../../../lib/shc-tiffin-recharge-hitpay";

const BodySchema = z
  .object({
    weeks: z.number().int().min(1).max(12).default(4),
  })
  .strict();

/**
 * POST /store/shc/tiffin/subscription/recharge/paynow
 * Create HitPay PayNow QR for tiffin plan recharge (customer JWT).
 * Ledger + subscription extend on HitPay webhook — not on this call.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Invalid recharge paynow body", parse.error.format() as any),
    });
  }

  try {
    const customerId = getCustomerId(req);
    const weeks = parse.data.weeks;
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const active = await tiffin.getActiveSubscription(customerId);
    if (!active) {
      return res.status(404).json({
        error: createSHCError("SHC-GENERIC-001", "No active tiffin subscription"),
      });
    }

    const amountCents = tiffinRechargeAmountCents(active.meals_per_week, weeks);
    const amountDollars = amountCents / 100;
    if (amountDollars <= 0) {
      return res.status(400).json({
        error: createSHCError("SHC-PAY-001", "Invalid recharge amount"),
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
        error: createSHCError("SHC-PAY-001", "PayNow unavailable (HITPAY_API_KEY not configured)"),
        provider: "hitpay_unconfigured",
      });
    }

    const reference = tiffinRechargeHitPayReference(customerId, weeks);
    const created = await createHitPayPayNowRequest({
      amountDollars,
      referenceNumber: reference,
      purpose: `SHC tiffin recharge ${weeks} week${weeks > 1 ? "s" : ""}`,
    });

    const qr_image_data_url = created.qr_payload
      ? await qrPayloadToDataUrl(created.qr_payload)
      : null;

    return res.json({
      provider: "hitpay",
      reference,
      weeks,
      subscription_id: active.id,
      amount: amountDollars,
      currency: "SGD",
      uen,
      display_name: displayName,
      payment_request_id: created.payment_request_id,
      checkout_url: created.checkout_url,
      qr_payload: created.qr_payload,
      qr_image_data_url,
      status: created.status,
    });
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Tiffin recharge PayNow failed");
  }
}
