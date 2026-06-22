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
    const [bids] = await this.listAndCountBids({ request_id: requestId } as any, { take: 50, order: { created_at: "ASC" } }).catch(() => [[]]);
    return bids as unknown as SHCBid[];
  }

  async listBidsForCook(cookId: string): Promise<SHCBid[]> {
    const [bids] = await this.listAndCountBids({ cook_id: cookId } as any, { take: 50, order: { created_at: "DESC" } }).catch(() => [[]]);
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
    const [rows] = await this.listAndCountBids({ id } as any, { take: 1 }).catch(() => [[]]);
    return ((rows as SHCBid[])?.[0] as SHCBid) || null;
  }
}

export default ShcBidModuleService;
