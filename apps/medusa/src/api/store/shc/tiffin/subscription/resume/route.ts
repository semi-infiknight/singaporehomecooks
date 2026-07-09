import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

/** POST /store/shc/tiffin/subscription/resume */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.resumeSubscription(customerId);
    res.json({ subscription: result });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Customer login required");
  }
}
