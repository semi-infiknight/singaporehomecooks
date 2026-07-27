import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { defaultBusinessRulesConfig, normalizeBusinessRulesConfig } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { loadBusinessRulesConfig, saveBusinessRulesConfig } from "../../../../lib/shc-business-rules-config";

const PatchSchema = z
  .object({
    commission: z.object({ default_rate_pct: z.number().min(0).max(100).optional() }).optional(),
    drop: z.object({ customer_window_days: z.number().int().min(1).max(30).optional() }).optional(),
    tiffin: z.object({ customize_cutoff_hours: z.number().int().min(1).max(72).optional() }).optional(),
    cart: z.object({ one_cook_enforced: z.boolean().optional() }).optional(),
    review: z.object({ eligible_statuses: z.array(z.string().min(1)).optional() }).optional(),
  })
  .strict();

/** GET /admin/shc/business-rules */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const config = await loadBusinessRulesConfig(statService);
    res.json({ config, defaults: defaultBusinessRulesConfig(), source: "platform_stat" });
  } catch (e: any) {
    const config = defaultBusinessRulesConfig();
    res.json({ config, defaults: config, source: "default", note: e.message });
  }
}

/** POST /admin/shc/business-rules — patch marketplace tunables. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = PatchSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid business rules payload", parse.error.format() as any) });
  }
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const current = await loadBusinessRulesConfig(statService);
    const body = parse.data;
    const next = normalizeBusinessRulesConfig({
      ...current,
      ...(body.commission ? { commission: { ...current.commission, ...body.commission } } : {}),
      ...(body.drop ? { drop: { ...current.drop, ...body.drop } } : {}),
      ...(body.tiffin ? { tiffin: { ...current.tiffin, ...body.tiffin } } : {}),
      ...(body.cart ? { cart: { ...current.cart, ...body.cart } } : {}),
      ...(body.review ? { review: { ...current.review, ...body.review } } : {}),
    });
    const saved = await saveBusinessRulesConfig(statService, next);
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.business_rules.update", config: saved });
    res.json({ config: saved, action: "update" });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Business rules save failed") });
  }
}
