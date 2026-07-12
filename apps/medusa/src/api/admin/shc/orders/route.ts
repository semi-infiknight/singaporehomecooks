import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";

/**
 * GET /admin/shc/orders
 * Ops monitoring: all marketplace orders (customer + cook activity).
 */
const QuerySchema = z
  .object({
    status: z.string().optional(),
    cook_id: z.string().optional(),
    customer_id: z.string().optional(),
    limit: z.coerce.number().int().positive().max(200).default(50),
  })
  .strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad orders query", parse.error.format() as any) });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const where: any = {};
  if (parse.data.status) where.shc_status = parse.data.status;
  if (parse.data.cook_id) where.cook_id = parse.data.cook_id;
  if (parse.data.customer_id) where.customer_id = parse.data.customer_id;

  try {
    const [metas, count] = await metaService.listAndCountOrderMetas(where, {
      take: parse.data.limit,
      order: { updated_at: "DESC" } as any,
    });

    const orders = (metas || []).map((m: any) => {
      const totalCents =
        m.total_cents != null && Number(m.total_cents) > 0
          ? Math.round(Number(m.total_cents))
          : m.total != null
            ? Math.round(Number(m.total) * 100)
            : 0;
      const items = m.items && m.items.length ? m.items : [];
      return {
        id: m.order_id,
        order_id: m.order_id,
        cook_id: m.cook_id,
        customer_id: m.customer_id,
        shc_status: m.shc_status,
        collection_date: m.collection_date,
        collection_slot: m.collection_slot,
        paynow_reference: m.paynow_reference,
        is_corporate: !!m.is_corporate,
        origin_request_id: m.origin_request_id || null,
        items,
        item_summary:
          items.map((i: any) => `${i.qty || 1}× ${i.name || "item"}`).join(", ") || "—",
        total: totalCents / 100,
        total_cents: totalCents,
        updated_at: m.updated_at,
        created_at: m.created_at,
      };
    });

    // Status histogram for monitoring widgets
    const by_status: Record<string, number> = {};
    for (const o of orders) {
      const s = String(o.shc_status || "unknown");
      by_status[s] = (by_status[s] || 0) + 1;
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.orders.list", count: orders.length });

    res.json({
      orders,
      count,
      by_status,
      note: "Ops cross-app order feed (customer checkout + cook fulfilment).",
    });
  } catch (e: any) {
    res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e.message || "List orders failed") });
  }
}
