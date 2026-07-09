import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const Body = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(200).optional(),
  })
  .strict();

/** POST /store/shc/tiffin/orders/kitchen-cancel — cook cancels a collection day */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid body") });
  }
  try {
    const cookId = getCookId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.kitchenCancelDay(
      cookId,
      parse.data.collection_date,
      parse.data.reason
    );
    res.json(result);
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Cook login required");
  }
}
