import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import { productTitleFromId } from "../../../../lib/shc-product-titles";

/**
 * GET /admin/shc/listings
 * Ops read mirror: cook-published product metas (no dual-write to Medusa Product module).
 */
const QuerySchema = z
  .object({
    cook_id: z.string().optional(),
    status: z.enum(["active", "paused"]).optional(),
    limit: z.coerce.number().int().positive().max(200).default(100),
  })
  .strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad listings query", parse.error.format() as any),
    });
  }

  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  let availService: ShcAvailabilityModuleService | null = null;
  try {
    availService = req.scope.resolve("shcAvailability") as any;
  } catch {
    availService = null;
  }

  const where: Record<string, string> = {};
  if (parse.data.cook_id) where.cook_id = parse.data.cook_id;

  try {
    const [metas, count] = await metaService.listAndCountProductMetas(where as any, {
      take: parse.data.limit,
      order: { updated_at: "DESC" } as any,
    });

    const availByProduct = new Map<string, any>();
    if (availService) {
      try {
        const [avails] = await availService.listAndCountAvailabilities({} as any, {
          take: 500,
        });
        for (const a of avails || []) {
          if (a?.product_id) availByProduct.set(String(a.product_id), a);
        }
      } catch {
        /* optional join */
      }
    }

    let listings = (metas || []).map((m: any) => {
      const avail = availByProduct.get(String(m.product_id));
      const paused = !!avail?.paused;
      const priceCents =
        m.price_cents != null && Number(m.price_cents) > 0
          ? Math.round(Number(m.price_cents))
          : null;
      return {
        id: m.product_id,
        product_id: m.product_id,
        name: m.name || productTitleFromId(m.product_id),
        cook_id: m.cook_id,
        cuisine: m.cuisine || null,
        price_cents: priceCents,
        price: priceCents != null ? priceCents / 100 : null,
        min_qty: m.min_qty != null ? Number(m.min_qty) : 1,
        halal: !!m.halal,
        status: paused ? "paused" : "active",
        paused,
        image_url: m.image_url || null,
        updated_at: m.updated_at,
        created_at: m.created_at,
      };
    });

    if (parse.data.status) {
      listings = listings.filter((l) => l.status === parse.data.status);
    }

    const by_status: Record<string, number> = { active: 0, paused: 0 };
    for (const l of listings) {
      by_status[l.status] = (by_status[l.status] || 0) + 1;
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.listings.list", count: listings.length });

    res.json({
      listings,
      count: parse.data.status ? listings.length : count,
      by_status,
      note: "SHC marketplace listings (read-only) — full ops in SHC Ops.",
    });
  } catch (e: any) {
    res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e.message || "List listings failed"),
    });
  }
}
