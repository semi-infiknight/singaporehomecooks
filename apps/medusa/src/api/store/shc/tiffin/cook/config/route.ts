import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";
import { shapeTiffinKitchen } from "../../../../../../lib/shc-tiffin-shape";

const ConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    tagline: z.string().max(200).optional(),
    eligible_product_ids: z.array(z.string()).optional(),
    meals_per_week_options: z.array(z.union([z.literal(2), z.literal(3), z.literal(4)])).optional(),
    collection_days: z.array(z.number().int().min(0).max(6)).optional(),
    default_collection_slot: z.string().optional(),
  })
  .strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cookId = getCookId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const config = await tiffin.getKitchenConfig(cookId);
    if (!config) {
      return res.json({
        config: {
          cook_id: cookId,
          enabled: false,
          eligible_product_ids: [],
          meals_per_week_options: [2, 3, 4],
          collection_days: [1, 2, 3, 4, 5],
          default_collection_slot: "18:00-19:00",
        },
      });
    }
    const kitchen = await shapeTiffinKitchen(config, req.scope);
    res.json({ config, kitchen });
  } catch {
    return unauthorized(res, "Cook login required");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parse = ConfigSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid tiffin config", parse.error.format() as any) });
  }
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }
  try {
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const config = await tiffin.upsertKitchenConfig(cookId, parse.data);
    const kitchen = await shapeTiffinKitchen(config, req.scope);
    res.json({ config, kitchen });
  } catch (e: any) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Failed to save tiffin config"),
    });
  }
}