import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requireCookId, requireCustomerId, unauthorized } from "../../../../lib/shc-actors";
import { listNotifications } from "../../../../lib/shc-notifications-store";

/** GET /store/shc/notifications?role=customer|cook */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const role = (req.query as any).role === "cook" ? "cook" : "customer";
  const actorId = role === "cook" ? requireCookId(req) : requireCustomerId(req);
  if (!actorId) {
    return unauthorized(res, role === "cook" ? "Cook login required" : "Customer login required");
  }
  res.json({ notifications: listNotifications(actorId) });
}