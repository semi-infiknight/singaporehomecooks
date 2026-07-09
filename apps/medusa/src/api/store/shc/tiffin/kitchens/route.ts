import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ShcTiffinModuleService from "../../../../../modules/shc-tiffin/service";
import { shapeTiffinKitchen } from "../../../../../lib/shc-tiffin-shape";

/** GET /store/shc/tiffin/kitchens — customer browse kitchens offering tiffin */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
  const configs = await tiffin.listEnabledKitchens();
  const kitchens = await Promise.all(configs.map((c) => shapeTiffinKitchen(c, req.scope)));
  res.json({ kitchens });
}