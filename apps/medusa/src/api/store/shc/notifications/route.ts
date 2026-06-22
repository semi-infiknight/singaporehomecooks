import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requireCookId, requireCustomerId, unauthorized } from "../../../../lib/shc-actors";
import { createSHCError } from "@shc/types";
import ShcNotificationModuleService from "../../../../modules/shc-notification/service";

/** GET /store/shc/notifications?role=customer|cook */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const role = (req.query as any).role === "cook" ? "cook" : "customer";
  const actorId = role === "cook" ? requireCookId(req) : requireCustomerId(req);
  if (!actorId) {
    return unauthorized(res, role === "cook" ? "Cook login required" : "Customer login required");
  }
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const notifications = await notifService.listForActor(actorId);
  res.json({ notifications });
}

/** POST /store/shc/notifications/mark-read { ids?: string[] } or all for actor */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const role = (req.query as any).role === "cook" ? "cook" : "customer";
  const actorId = role === "cook" ? requireCookId(req) : requireCustomerId(req);
  if (!actorId) {
    return unauthorized(res, role === "cook" ? "Cook login required" : "Customer login required");
  }
  const notifService: ShcNotificationModuleService = req.scope.resolve("shcNotification") as any;
  const body = (req.body as any) || {};
  if (body.all) {
    await notifService.markAllReadForActor(actorId);
    return res.json({ success: true, all: true });
  }
  if (Array.isArray(body.ids)) {
    for (const id of body.ids) {
      await notifService.markRead(id);
    }
    return res.json({ success: true, ids: body.ids });
  }
  return res.status(400).json({ error: createSHCError('SHC-GENERIC-001', 'Provide ids or all:true') });
}