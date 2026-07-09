import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { weekStartMonday, addDaysIso } from "@shc/business-rules";
import { getCustomerId, unauthorized } from "../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../modules/shc-tiffin/service";

/** GET /store/shc/tiffin/orders?from=&to= — calendar meal instances (HomelyEats My Orders) */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const from =
      typeof req.query?.from === "string" ? req.query.from : weekStartMonday();
    const to =
      typeof req.query?.to === "string" ? req.query.to : addDaysIso(from, 20);
    const result = await tiffin.listMealInstances(customerId, from, to);
    res.json(result);
  } catch {
    return unauthorized(res, "Customer login required");
  }
}
