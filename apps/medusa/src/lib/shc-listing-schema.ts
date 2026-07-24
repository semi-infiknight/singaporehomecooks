import { z } from "zod";

const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/);

export const ListingCreateSchema = z.object({
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
  last_minute_premium_pct: z.number().int().min(0).max(50).optional(),
  portions_per_day: z.number().int().positive().optional(),
  collection_days: z.array(z.number().int().min(0).max(6)).optional(),
  time_slots: z.array(timeSlotSchema).optional(),
  image_url: z.string().min(1).optional(),
  paused: z.boolean().optional(),
}).strict();

export const ListingUpdateSchema = ListingCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field required" }
);

export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof ListingUpdateSchema>;

export function listingPriceCents(data: { price?: number; price_cents?: number }) {
  return data.price_cents ?? Math.round((data.price ?? 12) * 100);
}