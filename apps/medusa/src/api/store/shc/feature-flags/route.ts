import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcFeatureFlagModuleService from "../../../../modules/shc-feature-flag/service";

const QuerySchema = z
  .object({
    key: z.string().min(1),
  })
  .strict();

const DEFAULTS: Record<string, boolean> = {
  request_dish: true,
  home_credits: true,
  corporate_orders: true,
};

/**
 * GET /store/shc/feature-flags?key=request_dish
 * Public read for client gating. Defaults are launch-on unless ops disables a flag in DB.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "key query param required") });
  }
  const { key } = parse.data;
  const flagService: ShcFeatureFlagModuleService = req.scope.resolve("shcFeatureFlag") as any;
  const enabled = await flagService.isEnabled(key, DEFAULTS[key] ?? false);
  res.json({ key, enabled });
}
