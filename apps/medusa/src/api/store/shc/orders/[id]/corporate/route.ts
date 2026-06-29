import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import ShcFeatureFlagModuleService from "../../../../../../modules/shc-feature-flag/service";
import { getAuthContext, getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";

const BodySchema = z
  .object({
    note: z.string().min(5).max(500),
  })
  .strict();

/**
 * POST /store/shc/orders/:id/corporate
 * Flag an order as corporate/group with an ops note (invoice stub / multi-dish).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: orderId } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid corporate note", parse.error.format() as any) });
  }

  getAuthContext(req);
  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const flagService: ShcFeatureFlagModuleService = req.scope.resolve("shcFeatureFlag") as any;
  const corporateEnabled = await flagService.isEnabled("corporate_orders", true);
  if (!corporateEnabled) {
    return res.status(403).json({
      error: createSHCError("SHC-GENERIC-001", "Corporate orders are not enabled on this environment."),
    });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  try {
    const existing = await metaService.getOrderMetaWithMessages(orderId);
    const meta = (existing as any)?.meta;
    if (!meta) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Order not found") });
    }
    if (meta.customer_id && meta.customer_id !== customerId) {
      return unauthorized(res, "Order does not belong to this customer");
    }

    const updated = await metaService.createOrUpdateMeta({
      order_id: orderId,
      is_corporate: true,
      corporate_note: parse.data.note,
    } as any);

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "order.corporate_flagged",
      order_id: orderId,
      customer_id: customerId,
    });

    res.json({ ok: true, order_id: orderId, is_corporate: true, corporate_note: parse.data.note, meta: updated });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Corporate flag failed") });
  }
}
