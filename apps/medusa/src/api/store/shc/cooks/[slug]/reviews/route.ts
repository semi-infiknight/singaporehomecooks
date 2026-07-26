import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";
import ShcReviewModuleService from "../../../../../../modules/shc-review/service";

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

function authorLabel(customerId: string): string {
  const tail = String(customerId || "guest").slice(-4);
  return `Guest •${tail}`;
}

/** GET /store/shc/cooks/:slug/reviews — public cook review list + aggregate */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params as { slug: string };
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad query params", parse.error.format() as any),
    });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const reviewService: ShcReviewModuleService = req.scope.resolve("shcReview") as any;
  const [cooks] = await cookService.listAndCountCooks({ slug } as any, { take: 1 });
  const cook = cooks?.[0] as any;
  if (!cook) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Cook not found: ${slug}`) });
  }

  const summary = await reviewService.getCookRatingSummary(cook.id).catch(() => ({ rating: null, review_count: 0 }));
  const { reviews, count } = await reviewService.listCookReviews(cook.id, parse.data);

  res.json({
    cook_id: cook.id,
    summary,
    count,
    reviews: reviews.map((row: any) => ({
      id: row.id,
      order_id: row.order_id,
      rating: Number(row.rating),
      body: row.body || "",
      created_at: row.created_at,
      author_label: authorLabel(row.customer_id),
    })),
  });
}
