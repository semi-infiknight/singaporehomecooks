import { MedusaService } from "@medusajs/framework/utils";
import { Review } from "./models/review";
import { createSHCError, shcReviewSchema, type SHCOrderStatus } from "@shc/types";
import { canSubmitReview } from "@shc/business-rules";

class ShcReviewModuleService extends MedusaService({ Review }) {
  async getReviewForOrder(orderId: string) {
    const [rows] = await this.listAndCountReviews({ order_id: orderId } as any, { take: 1 }).catch(() => [[]]);
    return (rows as any[])?.[0] || null;
  }

  async createReview(input: {
    order_id: string;
    cook_id: string;
    customer_id: string;
    rating: number;
    body?: string;
    order_status: SHCOrderStatus;
  }) {
    if (!canSubmitReview(input.order_status)) {
      throw createSHCError("SHC-REVIEW-001", "Reviews allowed only after collection (collected or completed)");
    }

    const existing = await this.getReviewForOrder(input.order_id);
    if (existing) {
      throw createSHCError("SHC-REVIEW-001", "One review per order");
    }

    const payload = shcReviewSchema.parse({
      id: `rev_${input.order_id}`,
      order_id: input.order_id,
      cook_id: input.cook_id,
      customer_id: input.customer_id,
      rating: input.rating,
      body: input.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const [created] = await this.createReviews([payload as any]);
    return created;
  }
}

export default ShcReviewModuleService;