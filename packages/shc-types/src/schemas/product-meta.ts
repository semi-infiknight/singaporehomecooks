import { z } from 'zod';

// Exact fields from blueprint/05-data-model/05-data-model.md (full)
export const shcProductMetaSchema = z.object({
  product_id: z.string(),
  cook_id: z.string(),
  cuisine: z.string(),
  occasion_tags: z.array(z.string()),
  allergen_tiers: z.object({
    tier1: z.array(z.string()), // mandatory
    tier2: z.array(z.string()).optional(),
    tier3: z.array(z.string()).optional(),
  }),
  halal: z.boolean(),
  calories: z.number().int().optional(),
  calories_confidence: z.enum(['full', 'category']),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })),
  min_qty: z.number().int().positive(),
  last_minute_premium_pct: z.number().min(0).max(100).optional(),
  image_url: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCProductMeta = z.infer<typeof shcProductMetaSchema>;
