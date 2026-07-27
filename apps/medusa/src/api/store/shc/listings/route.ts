import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { getCookId } from "../../../../lib/shc-actors";
import { shapeProduct } from "../../../../lib/shc-product-shape";
import { ListingCreateSchema, listingPriceCents } from "../../../../lib/shc-listing-schema";

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
  const parse = ListingCreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid listing", parse.error.format() as any) });
  }
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  try {
    const productId = `dish_${parse.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48)}_${Date.now()}`;
    const priceCents = listingPriceCents(parse.data);
    const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
    const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
    const meta = await metaService.upsertProductMeta({
      product_id: productId,
      cook_id: cookId,
      name: parse.data.name,
      description: parse.data.description,
      cuisine: parse.data.cuisine || "Singapore",
      occasion_tags: parse.data.occasion_tags || [],
      allergen_tiers: parse.data.allergen_tiers || { tier1: [], tier2: [], tier3: [] },
      halal: parse.data.halal ?? false,
      calories: parse.data.calories || 400,
      calories_confidence: parse.data.calories_confidence || "category",
      ingredients: parse.data.ingredients || [],
      min_qty: parse.data.min_qty,
      price_cents: priceCents,
      image_url: parse.data.image_url,
      last_minute_premium_pct: parse.data.last_minute_premium_pct ?? null,
      meal_extras: parse.data.meal_extras ?? [],
      meal_addons: parse.data.meal_addons ?? [],
      recipe_steps: parse.data.recipe_steps ?? [],
    } as any);
    await availService.upsertAvailability({
      product_id: productId,
      portions_per_day: parse.data.portions_per_day ?? 18,
      collection_days: parse.data.collection_days ?? [0, 1, 2, 3, 4, 5, 6],
      time_slots: parse.data.time_slots ?? ["17:00-19:00", "18:00-20:00"],
      paused: parse.data.paused ?? false,
    } as any);
    const product = await shapeProduct(meta, req.scope);
    return res.status(201).json({ product, listing: product });
  } catch (e: any) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Failed to publish listing"),
    });
  }
}