import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../../modules/shc-availability/service";
import { getCookId } from "../../../../../lib/shc-actors";
import { shapeProduct } from "../../../../../lib/shc-product-shape";
import { ListingUpdateSchema, listingPriceCents } from "../../../../../lib/shc-listing-schema";

import type { SHCProductMeta } from "@shc/types";

type OwnedListing =
  | { cookId: string; meta: SHCProductMeta; metaService: ShcProductMetaModuleService }
  | { status: number; body: ReturnType<typeof createSHCError> };

async function requireOwnedListing(req: MedusaRequest, productId: string): Promise<OwnedListing> {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return { status: 401, body: createSHCError("SHC-GENERIC-001", "Cook login required") };
  }
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const meta = await metaService.getMetaForCook(cookId, productId);
  if (!meta) {
    return { status: 404, body: createSHCError("SHC-GENERIC-001", "Listing not found") };
  }
  return { cookId, meta, metaService };
}

/** PATCH /store/shc/listings/:id — cook updates an existing listing */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = ListingUpdateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid listing update", parse.error.format() as any) });
  }

  const owned = await requireOwnedListing(req, id);
  if ("status" in owned) {
    return res.status(owned.status).json({ error: owned.body });
  }

  const { cookId, meta, metaService } = owned;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  const { paused, price, price_cents, portions_per_day, collection_days, time_slots, ...rest } = parse.data;

  try {
    const patch: Record<string, unknown> = { product_id: id, cook_id: cookId };
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.description !== undefined) patch.description = rest.description;
    if (rest.cuisine !== undefined) patch.cuisine = rest.cuisine;
    if (rest.occasion_tags !== undefined) patch.occasion_tags = rest.occasion_tags;
    if (rest.allergen_tiers !== undefined) patch.allergen_tiers = rest.allergen_tiers;
    if (rest.halal !== undefined) patch.halal = rest.halal;
    if (rest.calories !== undefined) patch.calories = rest.calories;
    if (rest.calories_confidence !== undefined) patch.calories_confidence = rest.calories_confidence;
    if (rest.ingredients !== undefined) patch.ingredients = rest.ingredients;
    if (rest.min_qty !== undefined) patch.min_qty = rest.min_qty;
    if (rest.image_url !== undefined) patch.image_url = rest.image_url;
    if (rest.last_minute_premium_pct !== undefined) patch.last_minute_premium_pct = rest.last_minute_premium_pct;
    if (price !== undefined || price_cents !== undefined) {
      patch.price_cents = listingPriceCents({ price, price_cents });
    }

    const updated = await metaService.upsertProductMeta(patch as any);
    const availPatch: Record<string, unknown> = { product_id: id };
    let availTouched = paused !== undefined;
    if (paused !== undefined) availPatch.paused = paused;
    if (portions_per_day !== undefined) {
      availPatch.portions_per_day = portions_per_day;
      availTouched = true;
    }
    if (collection_days !== undefined) {
      availPatch.collection_days = collection_days;
      availTouched = true;
    }
    if (time_slots !== undefined) {
      availPatch.time_slots = time_slots;
      availTouched = true;
    }
    if (availTouched) {
      await availService.upsertAvailability(availPatch as any);
    }
    const product = await shapeProduct(updated, req.scope);
    return res.json({ product, listing: product });
  } catch (e: any) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Failed to update listing"),
    });
  }
}

/** DELETE /store/shc/listings/:id — cook removes a listing */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const owned = await requireOwnedListing(req, id);
  if ("status" in owned) {
    return res.status(owned.status).json({ error: owned.body });
  }

  const { metaService } = owned;
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;

  try {
    await availService.deleteAvailabilityForProduct(id);
    await metaService.deleteProductMeta(id);
    return res.json({ ok: true, deleted_id: id });
  } catch (e: any) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Failed to delete listing"),
    });
  }
}