import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getCookId, getCustomerId } from "../../../../lib/shc-actors";
import { listNotifications } from "../../../../lib/shc-notifications-store";

/** GET /store/shc/notifications?role=customer|cook */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const role = (req.query as any).role === "cook" ? "cook" : "customer";
  const actorId = role === "cook" ? getCookId(req) : getCustomerId(req);
  res.json({ notifications: listNotifications(actorId) });
}