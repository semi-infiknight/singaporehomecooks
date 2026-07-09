import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";
import { shapeTiffinKitchen } from "../../../../../../lib/shc-tiffin-shape";

/** GET /store/shc/tiffin/kitchens/:cookId */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cookId = req.params.cookId as string;
  const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
  const config = await tiffin.getKitchenConfig(cookId);
  if (!config?.enabled) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Tiffin kitchen not found") });
  }
  const kitchen = await shapeTiffinKitchen(config, req.scope);
  res.json({ kitchen });
}