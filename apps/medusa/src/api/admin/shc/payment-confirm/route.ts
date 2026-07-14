import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { markOrderPaid } from "../../../../lib/shc-mark-order-paid";

/**
 * POST /admin/shc/payment-confirm
 * Ops marks PayNow received (manual bank match). Same core path as HitPay webhook.
 */
const BodySchema = z
  .object({
    order_id: z.string(),
    paynow_reference: z.string().min(3),
    notes: z.string().optional(),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-PAY-001", "Invalid confirm payload", parse.error.format() as any) });
  }
  const { order_id, paynow_reference, notes } = parse.data;

  try {
    const result = await markOrderPaid(req.scope, {
      order_id,
      paynow_reference,
      actor: "admin-payment-confirm",
      notes,
    });
    res.json({
      success: true,
      meta: result.meta,
      ledger_total_cents: result.total_cents,
      already_paid: result.already_paid,
      note: "Payment confirmed. Address release scheduled. Ledger commission posted when total known.",
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-PAY-001", e.message || "Confirm failed") });
  }
}
