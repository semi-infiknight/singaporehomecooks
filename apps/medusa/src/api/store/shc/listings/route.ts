import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { getCookId } from "../../../../lib/shc-actors";
import { shapeProduct } from "../../../../lib/shc-product-shape";

const CreateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  price: z.number().positive().optional(),
  price_cents: z.number().int().positive().optional(),
  min_qty: z.number().int().positive().default(5),
  calories: z.number().optional(),
  calories_confidence: z.enum(["full", "category"]).optional(),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.number(), unit: z.string() })).optional(),
  occasion_tags: z.array(z.string()).optional(),
  allergen_tiers: z.object({
    tier1: z.array(z.string()).default([]),
    tier2: z.array(z.string()).optional(),
    tier3: z.array(z.string()).optional(),
  }).optional(),
  halal: z.boolean().optional(),
  heritage_note: z.string().optional(),
  image_url: z.string().url().optional(), // support dish photo (media gap fix)
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
  // MinIO auth hardening + full server upload support: if image provided as url from our /upload (presigned or server mode)
  const productId = `dish_${parse.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48)}_${Date.now()}`;
  const priceCents = parse.data.price_cents ?? Math.round((parse.data.price ?? 12) * 100);
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
    heritage_note: parse.data.heritage_note,
    image_url: parse.data.image_url,
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