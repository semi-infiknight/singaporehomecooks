import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcDisputeModuleService from "../../../../../../modules/shc-dispute/service";
import ShcNotificationModuleService from "../../../../../../modules/shc-notification/service";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { getAuthContext, unauthorized } from "../../../../../../lib/shc-actors";

const BodySchema = z
  .object({
    type: z.enum(["customer_complaint", "cook_cancelled_late", "quality", "other"]).default("other"),
    notes: z.string().min(5).max(1000),
  })
  .strict();

function canAccessOrder(auth: ReturnType<typeof getAuthContext>, meta: any) {
  if (!auth || !meta) return false;
  if (auth.actor_type === "customer") return !meta.customer_id || meta.customer_id === auth.actor_id;
  if (auth.actor_type === "cook") return meta.cook_id === auth.actor_id;
  return false;
}

/** GET/POST /store/shc/orders/:id/dispute — customer/cook order issue reporting. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: orderId } = req.params as { id: string };
  const auth = getAuthContext(req);
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const disputeService: ShcDisputeModuleService = req.scope.resolve("shcDispute") as any;
  const data = await metaService.getOrderMetaWithMessages(orderId);

  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
  }
  if (!canAccessOrder(auth, data.meta)) {
    return unauthorized(res, "Order access denied");
  }

  const [disputes] = await disputeService.listAndCountDisputes({ order_id: orderId } as any, {
    take: 20,
  }).catch(() => [[]]);
  res.json({ disputes: disputes || [], count: disputes?.length || 0 });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: orderId } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid dispute payload", parse.error.format() as any) });
  }

  const auth = getAuthContext(req);
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const disputeService: ShcDisputeModuleService = req.scope.resolve("shcDispute") as any;
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const data = await metaService.getOrderMetaWithMessages(orderId);
  const meta = data.meta as any;

  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
  }
  if (!canAccessOrder(auth, meta)) {
    return unauthorized(res, "Order access denied");
  }

  const raisedBy = auth?.actor_type === "cook" ? "cook" : "customer";
  try {
    const [dispute] = await disputeService.createDisputes([
      {
        order_id: orderId,
        raised_by: raisedBy,
        type: parse.data.type,
        status: "open",
        notes: parse.data.notes,
      } as any,
    ]);
    await metaService.createOrUpdateMeta({
      order_id: orderId,
      shc_status: "disputed",
    } as any);

    const notifyTarget = raisedBy === "customer" ? meta.cook_id : meta.customer_id;
    if (notifyTarget) {
      await notifService.push(notifyTarget, {
        type: "dispute",
        body: `Issue reported for order ${orderId}. Ops will review.`,
      });
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "store.order_dispute.create",
      order_id: orderId,
      dispute_id: dispute?.id,
      raised_by: raisedBy,
      actor_id: auth?.actor_id,
    });
    res.status(201).json({ dispute });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Dispute create failed") });
  }
}
