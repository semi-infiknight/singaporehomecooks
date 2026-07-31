import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { estimateCaloriesFromIngredients } from "../../../../lib/shc-calorie-estimate";

/**
 * POST /store/shc/ai — calorie estimate from ingredients.
 * Uses USDA FoodData Central (free api.data.gov key) with Open Food Facts fallback.
 *
 * Env: USDA_FDC_API_KEY or FDC_API_KEY (defaults to DEMO_KEY — set a real key in production).
 */
const EstimateSchema = z
  .object({
    ingredients: z
      .array(
        z
          .object({
            name: z.string().trim().min(1),
            quantity: z.number().nonnegative(),
            unit: z.string(),
          })
          .strict()
      )
      .min(1),
    photo_url: z.string().url().optional(),
  })
  .strict();

/** GET /store/shc/ai/photo-tips — SG heritage listing photo tips. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const tips = [
    "Natural HDB window light — avoid flash to capture real steam and rempah gloss.",
    "Use banana leaf or traditional bowl + 1-2 props (cucumber/egg) for authentic SG scale.",
    "Include close-up texture shot (sambal, paste) + hero plated. Boosts search & trust.",
  ];
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({ event: "store.ai.photo-tips" });
  res.json({ tips, source: "Singapore Home Cooks listing guide" });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = EstimateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid ingredients for AI est", parse.error.format() as any) });
  }
  const actor = (req as any).auth?.actor_id || "cook-unknown";
  try {
    const result = await estimateCaloriesFromIngredients(parse.data.ingredients);
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({
      event: "store.ai.calorie-estimate",
      actor,
      ingredientsCount: parse.data.ingredients.length,
      calories: result.calories,
      source: result.source,
      matched: result.matched_ingredients,
    });
    res.json({
      calories: result.calories,
      confidence: result.confidence,
      source: result.source,
      note: result.note,
      matched_ingredients: result.matched_ingredients,
      total_ingredients: result.total_ingredients,
    });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "AI estimate failed") });
  }
}
