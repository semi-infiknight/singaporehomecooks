import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { getCookId, getCustomerId } from "../../../../../../lib/shc-actors";

/** GET /store/shc/orders/:id/messages */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(id);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }
  res.json({ messages: data.messages || [] });
}

const PostSchema = z.object({
  body: z.string().min(1),
  from: z.enum(["customer", "cook", "ops"]).default("customer"),
}).strict();

/** POST /store/shc/orders/:id/messages */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = PostSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid message", parse.error.format() as any) });
  }
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const senderId = parse.data.from === "cook" ? getCookId(req) : getCustomerId(req);
  await metaService.addOrderMessage(id, parse.data.from, senderId, parse.data.body);
  const data = await metaService.getOrderMetaWithMessages(id);
  res.status(201).json({ messages: data.messages || [] });
}