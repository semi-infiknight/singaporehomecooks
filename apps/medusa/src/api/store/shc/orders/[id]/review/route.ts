import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import ShcReviewModuleService from "../../../../../../modules/shc-review/service";
import { getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";

const PostSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000).optional(),
}).strict();

/** GET /store/shc/orders/:id/review */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const reviewService: ShcReviewModuleService = req.scope.resolve("shcReview") as any;
  const review = await reviewService.getReviewForOrder(id);
  res.json({ review });
}

/** POST /store/shc/orders/:id/review — customer only, post-collection */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = PostSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid review", parse.error.format() as any) });
  }

  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const reviewService: ShcReviewModuleService = req.scope.resolve("shcReview") as any;
  const data = await metaService.getOrderMetaWithMessages(id);
  const meta = data.meta as any;
  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }
  if (meta.customer_id && meta.customer_id !== customerId) {
    return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Not your order") });
  }

  try {
    const review = await reviewService.createReview({
      order_id: id,
      cook_id: meta.cook_id,
      customer_id: customerId,
      rating: parse.data.rating,
      body: parse.data.body,
      order_status: meta.shc_status,
    });
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify({ action: "review.create", order_id: id, customer_id: customerId, rating: parse.data.rating })}`);
    res.status(201).json({ review });
  } catch (e: any) {
    const code = e?.code || "SHC-GENERIC-001";
    res.status(400).json({ error: createSHCError(code, e.message || "Review failed") });
  }
}