import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, SHCOrderStatus } from "@shc/types";
import { orderStateTransitionWorkflow } from "../../../../../../workflows/order-state-transition";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { getCookId, unauthorized } from "../../../../../../lib/shc-actors";
import { pushNotification } from "../../../../../../lib/shc-notifications-store";
import { notifyOrderStatusPush } from "../../../../../../lib/shc-order-push";

const BodySchema = z.object({
  to: z.string(),
}).strict();

/** POST /store/shc/orders/:id/transition — cook/customer order state transition */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid transition", parse.error.format() as any) });
  }
  const to = parse.data.to as SHCOrderStatus;
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const [metas] = await metaService.listAndCountOrderMetas({ order_id: id } as any, { take: 1 });
  const current = metas?.[0] as any;
  if (!current) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }

  const result = await metaService.transitionOrderState(id, to, cookId);
  if (!result.valid) {
    return res.status(400).json({ error: createSHCError("SHC-ORDER-001", result.error || "Transition failed") });
  }
  await orderStateTransitionWorkflow.run({
    input: { orderId: id, to, container: req.scope },
  } as any).catch(() => null);

  const updated = await metaService.getOrderMetaWithMessages(id);
  const customerId = String((current as any).customer_id || (updated.meta as any)?.customer_id || "");
  if (customerId) {
    pushNotification(customerId, { type: "order", body: `Order ${id} is now ${to}.` });
  }
  pushNotification(cookId, { type: "order", body: `Order ${id} moved to ${to}.` });

  const logger = (req.scope as any).resolve?.("logger") || console;
  await notifyOrderStatusPush(req.scope, id, to, logger).catch(() => null);

  res.json({ order: updated.meta, messages: updated.messages });
}