import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { calculateCookEarnings } from "@shc/business-rules";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import { getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcDropModuleService from "../../../../../../modules/shc-drop/service";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import ShcNotificationModuleService from "../../../../../../modules/shc-notification/service";

const OrderSchema = z
  .object({
    qty: z.number().int().positive().max(200),
    allergen_acked: z.boolean().default(true),
    pdpa_consent: z.boolean().default(true),
  })
  .strict();

/**
 * POST /store/shc/drops/:id/order
 * Customer buys into a Cooking soon batch — fixed collection date/slot from the drop.
 * Does not use collab bidding; capacity-aware.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id || "");
  const parse = OrderSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid order", parse.error.format() as any) });
  }
  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;

  try {
    const { drop, qty } = await dropService.reserveQty(id, parse.data.qty);
    const unitPrice = Number(drop.price_cents) / 100;
    const totalCents = Number(drop.price_cents) * qty;
    const orderId = `SHC-D${Date.now().toString().slice(-8)}`;
    const items = [
      {
        product_id: drop.product_id || `drop_${drop.id}`,
        name: drop.title,
        qty,
        price: unitPrice,
        cook_id: drop.cook_id,
        drop_id: drop.id,
      },
    ];

    await metaService.createOrUpdateMeta({
      order_id: orderId,
      cook_id: drop.cook_id,
      customer_id: customerId,
      collection_date: drop.cook_date,
      collection_slot: drop.collection_slot,
      shc_status: "paid" as SHCOrderStatus,
      allergen_acked_at: parse.data.allergen_acked ? new Date().toISOString() : undefined,
      pdpa_consent_at: parse.data.pdpa_consent ? new Date().toISOString() : undefined,
      pdpa_consent_version: parse.data.pdpa_consent ? "v1.0-pdpa-2025" : undefined,
      origin_request_id: `drop:${drop.id}`,
      items,
      total_cents: totalCents,
      corporate_note: drop.note ? `Cooking soon: ${drop.note}` : `Cooking soon batch ${drop.id}`,
    } as any);

    if (parse.data.allergen_acked) {
      await metaService.addOrderMessage(
        orderId,
        "cook",
        drop.cook_id,
        `Thanks for joining my batch of ${drop.title}! Collection ${drop.cook_date} · ${drop.collection_slot}.`
      );
    }

    try {
      const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
      await notifService.push(customerId, {
        type: "order",
        body: `Ordered ${qty}× ${drop.title} — collect ${drop.cook_date}`,
      });
      await notifService.push(drop.cook_id, {
        type: "order",
        body: `Batch order: ${qty}× ${drop.title} (${drop.ordered_qty}/${drop.max_qty})`,
      });
    } catch {
      /* optional */
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "drop.ordered",
      drop_id: drop.id,
      order_id: orderId,
      qty,
      customer_id: customerId,
    });

    const shc_meta = await metaService.getOrderMetaWithMessages(orderId);
    res.status(201).json({
      order: {
        id: orderId,
        cook_id: drop.cook_id,
        customer_id: customerId,
        items,
        shc_status: "paid",
        collection_date: drop.cook_date,
        collection_slot: drop.collection_slot,
        total: totalCents / 100,
        total_cents: totalCents,
        origin_drop_id: drop.id,
      },
      drop,
      shc_meta,
      earningsPreview: calculateCookEarnings(totalCents) / 100,
    });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Drop order failed") });
  }
}
