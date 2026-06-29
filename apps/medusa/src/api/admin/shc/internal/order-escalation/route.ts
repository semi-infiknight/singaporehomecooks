import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ShcNotificationModuleService from "../../../../../modules/shc-notification/service";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import { requireWorker } from "../../../../../lib/shc-worker-auth";

/** POST /admin/shc/internal/order-escalation — worker reminder for paid orders awaiting cook acceptance. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!requireWorker(req, res)) return;

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const [orders] = await metaService.listAndCountOrderMetas({ shc_status: "paid" } as any, { take: 50 }).catch(() => [[]]);

  let reminded = 0;
  for (const order of orders || []) {
    if (!order.cook_id) continue;
    await notifService.push(order.cook_id, {
      type: "order_escalation",
      body: `Order ${order.order_id} is paid and awaiting acceptance.`,
    });
    reminded += 1;
  }

  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({ event: "worker.order_escalation", scanned: orders?.length || 0, reminded });
  res.json({ ok: true, scanned: orders?.length || 0, reminded });
}
