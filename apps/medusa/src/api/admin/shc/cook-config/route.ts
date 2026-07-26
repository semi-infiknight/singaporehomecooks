import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { defaultCookPortalConfig, normalizeCookPortalConfig } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { loadCookPortalConfig, saveCookPortalConfig } from "../../../../lib/shc-cook-portal-config";

const PatchSchema = z
  .object({
    greeting: z
      .object({
        morning: z.string().optional(),
        afternoon: z.string().optional(),
        evening: z.string().optional(),
      })
      .optional(),
    dashboard_tiles: z.array(z.record(z.unknown())).optional(),
    compliance_course_links: z.array(z.record(z.unknown())).optional(),
    allergen_tier1_presets: z.array(z.string()).optional(),
    collection_time_slot_presets: z.array(z.string()).optional(),
    chat_quick_replies: z
      .object({
        customer: z.array(z.string()).optional(),
        cook: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .strict();

/** GET /admin/shc/cook-config */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const config = await loadCookPortalConfig(statService);
    res.json({ config, defaults: defaultCookPortalConfig(), source: "platform_stat" });
  } catch (e: any) {
    const config = defaultCookPortalConfig();
    res.json({ config, defaults: config, source: "default", note: e.message });
  }
}

/** POST /admin/shc/cook-config — patch cook portal chrome. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = PatchSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid cook config payload", parse.error.format() as any) });
  }
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const current = await loadCookPortalConfig(statService);
    const body = parse.data;
    const next = normalizeCookPortalConfig({
      ...current,
      ...(body.greeting ? { greeting: { ...current.greeting, ...body.greeting } } : {}),
      ...(body.dashboard_tiles ? { dashboard_tiles: body.dashboard_tiles as any } : {}),
      ...(body.compliance_course_links ? { compliance_course_links: body.compliance_course_links as any } : {}),
      ...(body.allergen_tier1_presets ? { allergen_tier1_presets: body.allergen_tier1_presets } : {}),
      ...(body.collection_time_slot_presets
        ? { collection_time_slot_presets: body.collection_time_slot_presets }
        : {}),
      ...(body.chat_quick_replies
        ? {
            chat_quick_replies: {
              ...current.chat_quick_replies,
              ...body.chat_quick_replies,
            },
          }
        : {}),
    });
    const saved = await saveCookPortalConfig(statService, next);
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.cook_config.update" });
    res.json({ config: saved, action: "update" });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Cook config save failed") });
  }
}
