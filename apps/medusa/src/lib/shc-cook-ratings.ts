import ShcReviewModuleService from "../modules/shc-review/service";

export type CookRatingSummary = { rating: number | null; review_count: number };

export async function getCookRatingSummary(
  scope: any,
  cookId: string
): Promise<CookRatingSummary> {
  const reviewService: ShcReviewModuleService = scope.resolve("shcReview") as any;
  return reviewService.getCookRatingSummary(cookId).catch(() => ({ rating: null, review_count: 0 }));
}

/** Batch cook rating lookups for product/kitchen lists (deduped). */
export async function getCookRatingMap(
  scope: any,
  cookIds: string[]
): Promise<Map<string, CookRatingSummary>> {
  const unique = [...new Set(cookIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getCookRatingSummary(scope, id)] as const)
  );
  return new Map(entries);
}
