import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ShcNotificationModuleService from "../../../../../modules/shc-notification/service";
import { requireWorker } from "../../../../../lib/shc-worker-auth";

/** POST /admin/shc/internal/notification-retry — worker placeholder until delivery receipts exist. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!requireWorker(req, res)) return;

  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const [unread] = await notifService.listAndCountNotifications({ read: false } as any, { take: 100 }).catch(() => [[]]);
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({ event: "worker.notification_retry", pending_in_app: unread?.length || 0, retried: 0 });
  res.json({
    ok: true,
    pending_in_app: unread?.length || 0,
    retried: 0,
    note: "In-app notifications persist immediately; external delivery retry awaits push receipt storage.",
  });
}
