import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { tryCookId, tryCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import { notifyChatMessage } from "../../../../../../lib/shc-order-push";

async function loadOrderThread(req: MedusaRequest, orderId: string) {
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(orderId);
  if (!data.meta) return { ok: false as const, status: 404 as const };
  const meta = data.meta as any;
  const customerId = tryCustomerId(req);
  const cookId = tryCookId(req);
  if (customerId && String(meta.customer_id) === customerId) {
    return { ok: true as const, data, metaService, viewer: "customer" as const };
  }
  if (cookId && String(meta.cook_id) === cookId) {
    return { ok: true as const, data, metaService, viewer: "cook" as const };
  }
  return { ok: false as const, status: 403 as const };
}

/** GET /store/shc/orders/:id/messages — order party only */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const loaded = await loadOrderThread(req, id);
  if (!loaded.ok) {
    return res
      .status(loaded.status)
      .json({ error: createSHCError("SHC-GENERIC-001", loaded.status === 404 ? `Order not found: ${id}` : "Not allowed for this order") });
  }
  res.json({ messages: loaded.data.messages || [] });
}

const PostSchema = z.object({
  body: z.string().min(1).max(2000),
  from: z.enum(["customer", "cook", "ops"]).optional(),
}).strict();

/** POST /store/shc/orders/:id/messages */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = PostSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid message", parse.error.format() as any) });
  }

  const customerId = tryCustomerId(req);
  const cookId = tryCookId(req);
  if (!customerId && !cookId) {
    return unauthorized(res, "Login required");
  }

  const loaded = await loadOrderThread(req, id);
  if (!loaded.ok) {
    return res
      .status(loaded.status)
      .json({ error: createSHCError("SHC-GENERIC-001", loaded.status === 404 ? `Order not found: ${id}` : "Not allowed for this order") });
  }

  const senderActor = cookId ? "cook" : "customer";
  const senderId = cookId || customerId || "";
  await loaded.metaService.addOrderMessage(id, senderActor, senderId, parse.data.body.trim());

  const logger = (req.scope as any).resolve?.("logger") || console;
  await notifyChatMessage(req.scope, id, senderActor, parse.data.body.trim(), logger).catch(() => null);

  const data = await loaded.metaService.getOrderMetaWithMessages(id);
  res.status(201).json({ messages: data.messages || [] });
}
