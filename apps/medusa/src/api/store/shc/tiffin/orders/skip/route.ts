import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, tiffinCustomerError } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";
import { loadBusinessRulesConfigFromScope } from "../../../../../../lib/shc-business-rules-config";

const Body = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    collection_slot: z.string().optional(),
  })
  .strict();

/** POST /store/shc/tiffin/orders/skip — flex skip one meal day */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid skip body") });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const rules = await loadBusinessRulesConfigFromScope(req.scope);
    const result = await tiffin.skipMeal(
      customerId,
      parse.data.collection_date,
      parse.data.collection_slot,
      rules.tiffin.customize_cutoff_hours
    );
    res.json(result);
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Skip failed");
  }
}
