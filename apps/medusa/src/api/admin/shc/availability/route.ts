import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcAvailabilityModuleService from "../../../../modules/shc-availability/service";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import { productTitleFromId } from "../../../../lib/shc-product-titles";

/**
 * GET /admin/shc/availability
 * Ops read mirror: portion/day slots for inventory widget (no Medusa Inventory module write).
 */
const QuerySchema = z
  .object({
    product_id: z.string().optional(),
    paused: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    limit: z.coerce.number().int().positive().max(200).default(100),
  })
  .strict();

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCollectionDays(days: unknown): string {
  if (!Array.isArray(days) || days.length === 0) return "—";
  const labels = days
    .map((d) => DAY_LABELS[Number(d)] || String(d))
    .filter(Boolean);
  if (labels.length === 7) return "Every day";
  return labels.join(", ");
}

function formatTimeSlots(slots: unknown): string {
  if (!Array.isArray(slots) || slots.length === 0) return "—";
  return slots.map(String).join(", ");
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad availability query", parse.error.format() as any),
    });
  }

  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  let metaService: ShcProductMetaModuleService | null = null;
  try {
    metaService = req.scope.resolve("shcProductMeta") as any;
  } catch {
    metaService = null;
  }

  const where: Record<string, unknown> = {};
  if (parse.data.product_id) where.product_id = parse.data.product_id;
  if (parse.data.paused !== undefined) where.paused = parse.data.paused;

  try {
    const [rows, count] = await availService.listAndCountAvailabilities(where as any, {
      take: parse.data.limit,
      order: { updated_at: "DESC" } as any,
    });

    const nameByProduct = new Map<string, string>();
    if (metaService) {
      try {
        const [metas] = await metaService.listAndCountProductMetas({} as any, { take: 500 });
        for (const m of metas || []) {
          if (m?.product_id) {
            nameByProduct.set(String(m.product_id), m.name || productTitleFromId(m.product_id));
          }
        }
      } catch {
        /* optional join */
      }
    }

    const availability = (rows || []).map((a: any) => {
      const productId = String(a.product_id || "");
      const days = a.collection_days;
      const slots = a.time_slots;
      return {
        id: a.id,
        product_id: productId,
        name: nameByProduct.get(productId) || productTitleFromId(productId),
        portions_per_day: a.portions_per_day != null ? Number(a.portions_per_day) : null,
        collection_days: Array.isArray(days) ? days : [],
        collection_days_label: formatCollectionDays(days),
        time_slots: Array.isArray(slots) ? slots : [],
        time_slots_label: formatTimeSlots(slots),
        paused: !!a.paused,
        status: a.paused ? "paused" : "active",
        updated_at: a.updated_at,
        created_at: a.created_at,
      };
    });

    const by_status: Record<string, number> = { active: 0, paused: 0 };
    for (const row of availability) {
      by_status[row.status] = (by_status[row.status] || 0) + 1;
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.availability.list", count: availability.length });

    res.json({
      availability,
      count,
      by_status,
      note: "SHC portion availability (read-only) — full ops in SHC Ops.",
    });
  } catch (e: any) {
    res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e.message || "List availability failed"),
    });
  }
}
