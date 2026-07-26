import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { buildCustomerConfigPayload, normalizeCustomerBrowseConfig } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import {
  loadCustomerBrowseConfig,
  loadStoredCategories,
  loadStoredPromos,
  saveCustomerBrowseConfig,
} from "../../../../lib/shc-customer-config";

const PatchSchema = z
  .object({
    config: z.record(z.unknown()).optional(),
    occasions: z.array(z.record(z.unknown())).optional(),
    meal_type_chips: z.array(z.record(z.unknown())).optional(),
    copy: z.record(z.unknown()).optional(),
    popular: z.object({ min_rating: z.number().optional(), top_percent: z.number().optional() }).optional(),
    defaults: z
      .object({
        location_label: z.string().optional(),
        kitchen_open_fallback: z.string().optional(),
      })
      .optional(),
    discover_modes: z.array(z.record(z.unknown())).optional(),
    occasions_nav: z.object({ label: z.string().optional(), testID: z.string().optional() }).optional(),
  })
  .strict();

/** GET /admin/shc/customer-config */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const [categories, promos, browse] = await Promise.all([
      loadStoredCategories(statService),
      loadStoredPromos(statService),
      loadCustomerBrowseConfig(statService),
    ]);
    const payload = buildCustomerConfigPayload({ categories, promos, browse });
    res.json({ ...payload, source: "platform_stat" });
  } catch (e: any) {
    const payload = buildCustomerConfigPayload({});
    res.json({ ...payload, source: "default", note: e.message });
  }
}

/** POST /admin/shc/customer-config — patch browse chrome. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = PatchSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid customer config payload", parse.error.format() as any) });
  }
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const current = await loadCustomerBrowseConfig(statService);
    const body = parse.data;
    const next = normalizeCustomerBrowseConfig({
      ...current,
      ...(body.occasions ? { occasions: body.occasions } : {}),
      ...(body.meal_type_chips ? { meal_type_chips: body.meal_type_chips } : {}),
      ...(body.discover_modes ? { discover_modes: body.discover_modes } : {}),
      ...(body.occasions_nav ? { occasions_nav: { ...current.occasions_nav, ...body.occasions_nav } } : {}),
      ...(body.copy ? { copy: { ...current.copy, ...body.copy } } : {}),
      ...(body.popular ? { popular: { ...current.popular, ...body.popular } } : {}),
      ...(body.defaults ? { defaults: { ...current.defaults, ...body.defaults } } : {}),
      ...(body.config ? body.config : {}),
    });
    const saved = await saveCustomerBrowseConfig(statService, next);
    const [categories, promos] = await Promise.all([
      loadStoredCategories(statService),
      loadStoredPromos(statService),
    ]);
    const payload = buildCustomerConfigPayload({ categories, promos, browse: saved });
    res.json({ ...payload, action: "update" });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Customer config save failed") });
  }
}
