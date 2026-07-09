import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, tiffinCustomerError } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const Body = z
  .object({
    cooking_notes: z.string().max(2000).nullable().optional(),
    collection_notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

/** PATCH /store/shc/tiffin/subscription/notes — cooking + collection instructions */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid notes body") });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const meta = await tiffin.updateSubscriptionNotes(customerId, parse.data);
    res.json({ ok: true, cooking_notes: meta.cooking_notes, collection_notes: meta.collection_notes });
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Update notes failed");
  }
}
