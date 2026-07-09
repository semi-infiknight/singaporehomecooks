import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, tiffinCustomerError } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const Body = z.object({ days: z.number().int().min(1).max(30).default(1) }).strict();

/** POST /store/shc/tiffin/subscription/pause — HomelyEats flex pause */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || { days: 1 });
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid pause body") });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.pauseSubscription(customerId, parse.data.days);
    res.json({ subscription: result });
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Pause failed");
  }
}
