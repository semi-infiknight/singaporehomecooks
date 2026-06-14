import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";

/**
 * POST /store/shc/ai/calorie-estimate
 * Stub for AI calorie from ingredients list (per Phase 9 + DECISION_TREES/ai-calorie-estimation.md).
 * Returns {calories, confidence, source}. Green/amber badge ready.
 *
 * REAL PATH NOTES (for swap to Claude):
 * - Use Claude 3.5/Opus vision + structured output (JSON schema for calories + confidence 0-1 + rationale).
 * - Input: ingredients[] + optional photo base64/url for vision.
 * - Rate limit: enforced here + middleware (see production-hardening: 5-10/min per actor).
 * - Cost guard: track token usage / $ in redis or ledger; fallback to stub if budget hit or error.
 * - Config: process.env.CLAUDE_API_KEY, SHC_AI_COST_LIMIT_CENTS=500, etc.
 * - Structured: tool use or response_format json. Never medical advice (disclaimer always).
 * - Cache per (ingredients hash + photo hash). Re-est on significant change.
 * - Confidence >=0.8 -> "full" else "category". Store in product_meta via caller.
 */
const EstimateSchema = z.object({
  ingredients: z.array(z.object({ name: z.string(), quantity: z.number(), unit: z.string() })).min(1),
  photo_url: z.string().optional(), // for future vision
}).strict();

/**
 * GET /store/shc/ai/photo-tips
 * 3 SG-specific photo quality tips stub. (Future: AI scored on upload.)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // photo-tips
  const tips = [
    "Natural HDB window light — avoid flash to capture real steam and rempah gloss.",
    "Use banana leaf or traditional bowl + 1-2 props (cucumber/egg) for authentic SG scale.",
    "Include close-up texture shot (sambal, paste) + hero plated. Boosts search & trust.",
  ];
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({ event: "store.ai.photo-tips" });
  res.json({ tips, source: "SG heritage stub (see ai-calorie-estimation.md for vision upgrade)" });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // calorie estimate
  const parse = EstimateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid ingredients for AI est", parse.error.format() as any) });
  }
  const actor = (req as any).auth?.actor_id || "cook-unknown";
  try {
    // Rate limit stub (production-hardening day1)
    // In real: use redis or middleware rate-limiter-flexible keyed by actor
    // if (rateLimitHit(actor, 'ai-estimate')) throw createSHCError(..., 'rate limit');
    const { ingredients } = parse.data;
    // Deterministic stub logic (matches mobile mock parity; SG ingredients)
    let base = 320;
    ingredients.forEach((ing: any) => {
      const n = ing.name.toLowerCase();
      if (n.includes("rice") || n.includes("coconut")) base += 80;
      if (n.includes("prawn") || n.includes("chicken") || n.includes("ayam")) base += 45;
      if (n.includes("nut") || n.includes("keluak") || n.includes("peanut")) base += 30;
      if (n.includes("potato")) base += 25;
    });
    const conf = ingredients.length >= 5 ? "full" : "category";
    const cals = Math.min(650, Math.max(280, Math.round(base)));
    const result = {
      calories: cals,
      confidence: conf,
      source: "AI stub (ingredients; swap to Claude vision+structured per DECISION_TREES/ai-calorie-estimation.md)",
      note: "Advisory only. Rate-limited + cost-guarded in prod. Config via env CLAUDE_* .",
    };
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.ai.calorie-estimate", actor, ingredientsCount: ingredients.length, result });
    // Cost guard note: in real check cumulative spend before call, log usage.
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "AI estimate failed") });
  }
}
