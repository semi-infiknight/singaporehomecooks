import { z } from "zod";

const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/);

const mealOptionSchema = z.object({
  id: z.string().min(1).max(48),
  label: z.string().min(1).max(80),
  price_delta: z.number().min(0).max(100).optional(),
  priceDelta: z.number().min(0).max(100).optional(),
});

const recipeStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string().min(4).max(280),
  tip: z.string().max(160).optional(),
});

const allergenTiersSchema = z.object({
  tier1: z.array(z.string()).default([]),
  tier2: z.array(z.string()).optional(),
  tier3: z.array(z.string()).optional(),
});

const ingredientSchema = z.object({
  name: z.string().min(2),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

const MIN_LISTING_ORDER_VALUE_SGD = 50;

function listingPublishRefines<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine((data: any) => data.price != null || data.price_cents != null, {
      message: "Price is required",
      path: ["price"],
    })
    .refine((data: any) => (data.ingredients?.length ?? 0) >= 1, {
      message: "At least one ingredient required",
      path: ["ingredients"],
    })
    .refine((data: any) => (data.occasion_tags?.length ?? 0) >= 1, {
      message: "At least one occasion tag required",
      path: ["occasion_tags"],
    })
    .refine(
      (data: any) =>
        (data.allergen_tiers?.tier1?.length ?? 0) >= 1 || data.allergen_none_confirmed === true,
      { message: "Allergen disclosure required", path: ["allergen_tiers"] }
    )
    .refine(
      (data: any) =>
        (data.collection_days?.length ?? 0) >= 1 && (data.time_slots?.length ?? 0) >= 1,
      { message: "Collection days and time slots required", path: ["collection_days"] }
    )
    .refine((data: any) => {
      const cents =
        data.price_cents ?? (data.price != null ? Math.round(Number(data.price) * 100) : 0);
      const minQty = data.min_qty ?? 5;
      return cents * minQty >= MIN_LISTING_ORDER_VALUE_SGD * 100;
    }, {
      message: `Minimum order value must be at least S$${MIN_LISTING_ORDER_VALUE_SGD}`,
      path: ["min_qty"],
    });
}

export const ListingCreateSchema = listingPublishRefines(
  z
    .object({
      name: z.string().min(3),
      description: z.string().optional(),
      cuisine: z.string().min(2),
      price: z.number().positive().optional(),
      price_cents: z.number().int().positive().optional(),
      min_qty: z.number().int().positive().default(5),
      calories: z.number().optional(),
      calories_confidence: z.enum(["full", "category"]).optional(),
      ingredients: z.array(ingredientSchema).min(1),
      occasion_tags: z.array(z.string().min(1)).min(1),
      allergen_tiers: allergenTiersSchema.optional(),
      allergen_none_confirmed: z.boolean().optional(),
      halal: z.boolean().optional(),
      portions_per_day: z.number().int().positive().optional(),
      collection_days: z.array(z.number().int().min(0).max(6)).min(1),
      time_slots: z.array(timeSlotSchema).min(1),
      image_url: z.string().min(1).optional(),
      meal_extras: z.array(mealOptionSchema).max(6).optional(),
      meal_addons: z.array(mealOptionSchema).max(8).optional(),
      recipe_steps: z.array(recipeStepSchema).max(8).optional(),
      paused: z.boolean().optional(),
    })
    .strict()
);

export const ListingUpdateSchema = z
  .object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    cuisine: z.string().min(2).optional(),
    price: z.number().positive().optional(),
    price_cents: z.number().int().positive().optional(),
    min_qty: z.number().int().positive().optional(),
    calories: z.number().optional(),
    calories_confidence: z.enum(["full", "category"]).optional(),
    ingredients: z.array(ingredientSchema).min(1).optional(),
    occasion_tags: z.array(z.string().min(1)).min(1).optional(),
    allergen_tiers: allergenTiersSchema.optional(),
    allergen_none_confirmed: z.boolean().optional(),
    halal: z.boolean().optional(),
    portions_per_day: z.number().int().positive().optional(),
    collection_days: z.array(z.number().int().min(0).max(6)).min(1).optional(),
    time_slots: z.array(timeSlotSchema).min(1).optional(),
    image_url: z.string().min(1).optional(),
    meal_extras: z.array(mealOptionSchema).max(6).optional(),
    meal_addons: z.array(mealOptionSchema).max(8).optional(),
    recipe_steps: z.array(recipeStepSchema).max(8).optional(),
    paused: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field required" });

export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof ListingUpdateSchema>;

export function listingPriceCents(data: { price?: number; price_cents?: number }) {
  if (data.price_cents != null) return data.price_cents;
  if (data.price != null) return Math.round(data.price * 100);
  throw new Error("price or price_cents required");
}
