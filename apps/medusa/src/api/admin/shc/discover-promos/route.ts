import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import {
  DISCOVER_PROMOS_STAT_KEY,
  defaultDiscoverPromoConfigs,
  normalizeDiscoverPromoConfigs,
  type DiscoverPromoConfig,
} from "../../../../lib/shc-discover-promos";

async function loadPromos(statService: ShcPlatformStatModuleService): Promise<DiscoverPromoConfig[]> {
  const [existing] = await statService.listAndCountPlatformStats({ key: DISCOVER_PROMOS_STAT_KEY }, { take: 1 });
  return normalizeDiscoverPromoConfigs(existing?.[0]?.value);
}

async function savePromos(statService: ShcPlatformStatModuleService, promos: DiscoverPromoConfig[]) {
  const sorted = normalizeDiscoverPromoConfigs(promos);
  const [existing] = await statService.listAndCountPlatformStats({ key: DISCOVER_PROMOS_STAT_KEY }, { take: 1 });
  if (existing?.[0]?.id) {
    await statService.updatePlatformStats({
      selector: { id: existing[0].id },
      data: { value: sorted } as any,
    });
  } else {
    await statService.createPlatformStats([{ key: DISCOVER_PROMOS_STAT_KEY, value: sorted } as any]);
  }
  return sorted;
}

const UpsertSchema = z
  .object({
    id: z.string().min(1).max(64),
    title: z.string().min(1).max(120),
    subtitle: z.string().max(200).optional(),
    badge: z.string().max(40).optional(),
    image_url: z.string().optional(),
    imageUrl: z.string().optional(),
    icon_key: z.enum(["discover", "home", "people"]).optional(),
    iconKey: z.enum(["discover", "home", "people"]).optional(),
    mobile_route: z.string().optional(),
    mobileRoute: z.string().optional(),
    web_route: z.string().optional(),
    webRoute: z.string().optional(),
    occasion_filter: z.string().optional(),
    occasionFilter: z.string().optional(),
    enabled: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const ReplaceSchema = z
  .object({
    promos: z.array(UpsertSchema).min(1).max(20),
  })
  .strict();

function toConfigRow(input: z.infer<typeof UpsertSchema>, fallback?: DiscoverPromoConfig): DiscoverPromoConfig {
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle || fallback?.subtitle || "",
    badge: input.badge || fallback?.badge,
    image_url: input.image_url || input.imageUrl || fallback?.image_url || "",
    icon_key: input.icon_key || input.iconKey || fallback?.icon_key,
    mobile_route: input.mobile_route || input.mobileRoute || fallback?.mobile_route || "/(customer)/",
    web_route: input.web_route || input.webRoute || fallback?.web_route || "/",
    occasion_filter: input.occasion_filter || input.occasionFilter || fallback?.occasion_filter,
    enabled: input.enabled !== false,
    sort_order: input.sort_order ?? fallback?.sort_order ?? 60,
  };
}

/** GET /admin/shc/discover-promos */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const promos = await loadPromos(statService);
    res.json({ promos, count: promos.length, source: "platform_stat" });
  } catch (e: any) {
    res.json({
      promos: defaultDiscoverPromoConfigs(),
      count: defaultDiscoverPromoConfigs().length,
      source: "default",
      note: e.message,
    });
  }
}

/** POST /admin/shc/discover-promos — upsert one or replace all */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body || {};
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    if (Array.isArray((body as any).promos)) {
      const parse = ReplaceSchema.safeParse(body);
      if (!parse.success) {
        return res
          .status(400)
          .json({ error: createSHCError("SHC-GENERIC-001", "Invalid promos payload", parse.error.format() as any) });
      }
      const promos = await savePromos(
        statService,
        parse.data.promos.map((p, i) => {
          const base = toConfigRow(p);
          return { ...base, sort_order: p.sort_order ?? (i + 1) * 10 };
        })
      );
      return res.json({ promos, count: promos.length, action: "replace" });
    }

    const parse = UpsertSchema.safeParse(body);
    if (!parse.success) {
      return res
        .status(400)
        .json({ error: createSHCError("SHC-GENERIC-001", "Invalid promo payload", parse.error.format() as any) });
    }
    const current = await loadPromos(statService);
    const next = [...current];
    const idx = next.findIndex((p) => p.id === parse.data.id);
    const row = toConfigRow(parse.data, idx >= 0 ? next[idx] : undefined);
    if (idx >= 0) next[idx] = row;
    else next.push(row);
    const promos = await savePromos(statService, next);
    res.json({ promos, promo: row, count: promos.length, action: idx >= 0 ? "update" : "create" });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Promo save failed") });
  }
}

/** DELETE /admin/shc/discover-promos?id=promo-tiffin */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any)?.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "id query required") });
  }
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const current = await loadPromos(statService);
    const next = current.filter((p) => p.id !== id);
    if (next.length === current.length) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Promo not found: ${id}`) });
    }
    const promos = await savePromos(statService, next);
    res.json({ ok: true, promos, count: promos.length });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Delete failed") });
  }
}
