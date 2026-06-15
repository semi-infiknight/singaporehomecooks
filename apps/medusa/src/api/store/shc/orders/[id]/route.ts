import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";

/** GET /store/shc/orders/:id — single order with messages */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(id);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }
  const m = data.meta as any;
  res.json({
    order: {
      id: m.order_id,
      cook_id: m.cook_id,
      shc_status: m.shc_status,
      collection_date: m.collection_date,
      collection_slot: m.collection_slot,
      paynow_reference: m.paynow_reference,
      allergen_acked_at: m.allergen_acked_at,
      pdpa_consent_at: m.pdpa_consent_at,
      customer_id: m.customer_id || "cust_demo",
      credits_applied: m.credits_applied_cents || 0,
      is_corporate: !!m.is_corporate,
    },
    messages: data.messages || [],
  });
}