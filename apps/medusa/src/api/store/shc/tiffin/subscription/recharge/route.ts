import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, tiffinCustomerError } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const BodySchema = z
  .object({
    weeks: z.number().int().min(1).max(12).default(4),
    paynow_ref: z.string().max(80).optional(),
  })
  .strict();

/**
 * POST /store/shc/tiffin/subscription/recharge
 * HomelyEats recharge plan — PayNow ref + ledger + extend period.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Invalid recharge body", parse.error.format() as any),
    });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.rechargeSubscription(customerId, parse.data.weeks, {
      paynowRef: parse.data.paynow_ref,
    });
    res.json({ subscription: result, ok: true });
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Recharge failed");
  }
}
