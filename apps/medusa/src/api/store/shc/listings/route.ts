import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { getCookId } from "../../../../lib/shc-actors";
import { shapeProduct } from "../../../../lib/shc-product-shape";

const CreateSchema = z.object({
  name: z.string().min(3),
  cuisine: z.string().optional(),
  price: z.number().positive().optional(),
  min_qty: z.number().int().positive().default(5),
  calories: z.number().optional(),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.number(), unit: z.string() })).optional(),
  occasion_tags: z.array(z.string()).optional(),
}).strict();

/** GET /store/shc/listings — cook's published product metas */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const [metas] = await metaService.listAndCountProductMetas({ cook_id: cookId } as any, { take: 100 }).catch(() => [[]]);
  const listings = await Promise.all((metas as any[]).map((m) => shapeProduct(m, req.scope)));
  res.json({ listings });
}

/** POST /store/shc/listings — cook creates product meta + availability */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid listing", parse.error.format() as any) });
  }
  const cookId = getCookId(req);
  const productId = `prod_${parse.data.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}`;
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  const meta = await metaService.upsertProductMeta({
    product_id: productId,
    cook_id: cookId,
    cuisine: parse.data.cuisine || "Singapore",
    occasion_tags: parse.data.occasion_tags || [],
    allergen_tiers: { tier1: [], tier2: [], tier3: [] },
    halal: false,
    calories: parse.data.calories || 400,
    calories_confidence: "category",
    ingredients: parse.data.ingredients || [],
    min_qty: parse.data.min_qty,
  } as any);
  await availService.upsertAvailability({
    product_id: productId,
    portions_per_day: 18,
    collection_days: [0, 1, 2, 3, 4, 5, 6],
    time_slots: ["17:00-19:00", "18:00-20:00"],
    paused: false,
  } as any);
  const product = await shapeProduct(meta, req.scope);
  res.status(201).json({ product, listing: product });
}