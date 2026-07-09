import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const BodySchema = z
  .object({
    weeks: z.number().int().min(1).max(12).default(4),
  })
  .strict();

/**
 * POST /store/shc/tiffin/subscription/recharge
 * HomelyEats recharge plan — extend period + restore flex + add deliveries.
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
    const result = await tiffin.rechargeSubscription(customerId, parse.data.weeks);
    res.json({ subscription: result, ok: true });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Customer login required");
  }
}
