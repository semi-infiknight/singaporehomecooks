import { MedusaService } from "@medusajs/framework/utils";
import { Bid } from "./models/bid";
import { SHCBid, shcBidSchema, createSHCError } from "@shc/types";

/**
 * shc-bid module.
 * Supports Phase 8 bidding on customer requests. Accept drives request-originated order.
 * Frozen shcBidSchema used. Events for accept -> order flow.
 */
class ShcBidModuleService extends MedusaService({ Bid }) {
  async createBid(data: Partial<SHCBid>): Promise<SHCBid> {
    const validated = shcBidSchema.partial().parse(data);
    if (!validated.price_cents || validated.price_cents <= 0) {
      throw createSHCError("SHC-REQ-001", "Bid price_cents must be positive");
    }
    const [created] = await this.createBids([{
      ...validated,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any]);
    return created as unknown as SHCBid;
  }

  async listBidsForRequest(requestId: string): Promise<SHCBid[]> {
    const [bids] = await (this as any).listAndCountBids({
      filters: { request_id: requestId },
      order: { created_at: "ASC" },
    } as any);
    return bids as unknown as SHCBid[];
  }

  async listBidsForCook(cookId: string): Promise<SHCBid[]> {
    const [bids] = await (this as any).listAndCountBids({
      filters: { cook_id: cookId },
      order: { created_at: "DESC" },
    } as any);
    return bids as unknown as SHCBid[];
  }

  async acceptBid(bidId: string): Promise<SHCBid> {
    const [updated] = await this.updateBids({
      selector: { id: bidId },
      data: { status: "accepted", updated_at: new Date() } as any,
    });
    return updated as unknown as SHCBid;
  }

  async getBid(id: string): Promise<SHCBid | null> {
    const [bid] = await this.listBids({ filters: { id } } as any);
    return (bid as unknown as SHCBid) || null;
  }
}

export default ShcBidModuleService;
