import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcCookModuleService from "../../../../../modules/shc-cook/service";
import ShcReviewModuleService from "../../../../../modules/shc-review/service";

/** GET /store/shc/cooks/:slug — single cook profile */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params as { slug: string };
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const reviewService: ShcReviewModuleService = req.scope.resolve("shcReview") as any;
  const [cooks] = await cookService.listAndCountCooks({ slug } as any, { take: 1 });
  const cook = cooks?.[0] as any;
  if (!cook) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Cook not found: ${slug}`) });
  }
  const ratingSummary = await reviewService.getCookRatingSummary(cook.id).catch(() => ({ rating: null, review_count: 0 }));
  res.json({
    cook: {
      id: cook.id,
      slug: cook.slug,
      display_name: cook.display_name,
      story: cook.story,
      area: cook.area,
      status: cook.status,
      collection_address: cook.collection_address,
      collection_instructions: cook.collection_instructions,
      rating: ratingSummary.rating,
      review_count: ratingSummary.review_count,
    },
  });
}