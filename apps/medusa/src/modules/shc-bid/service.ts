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

  async findPendingBidForCookOnRequest(cookId: string, requestId: string): Promise<SHCBid | null> {
    const bids = await this.listBidsForRequest(requestId);
    return bids.find((b) => b.cook_id === cookId && b.status === "pending") || null;
  }

  /** Save quote — update existing pending bid from same cook, or create new. */
  async upsertPendingBid(data: Partial<SHCBid> & { cook_id: string; request_id: string }): Promise<SHCBid> {
    const validated = shcBidSchema.partial().parse(data);
    if (!validated.price_cents || validated.price_cents <= 0) {
      throw createSHCError("SHC-REQ-001", "Bid price_cents must be positive");
    }
    const existing = await this.findPendingBidForCookOnRequest(data.cook_id, data.request_id);
    const now = new Date().toISOString();
    if (existing) {
      const [updated] = await this.updateBids({
        selector: { id: existing.id },
        data: {
          price_cents: validated.price_cents,
          message: validated.message ?? null,
          line_items_json: (validated as any).line_items_json ?? null,
          updated_at: now,
        } as any,
      });
      return updated as unknown as SHCBid;
    }
    return this.createBid(validated);
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

  async rejectBid(bidId: string): Promise<SHCBid | null> {
    const [updated] = await this.updateBids({
      selector: { id: bidId },
      data: { status: "rejected", updated_at: new Date() } as any,
    });
    return (updated as unknown as SHCBid) || null;
  }

  /** Decline all other pending quotes when customer accepts one. */
  async rejectPendingBidsForRequest(requestId: string, exceptBidId: string): Promise<number> {
    const pending = (await this.listBidsForRequest(requestId)).filter(
      (b) => b.status === "pending" && b.id !== exceptBidId
    );
    for (const bid of pending) {
      await this.rejectBid(bid.id);
    }
    return pending.length;
  }

  async getBid(id: string): Promise<SHCBid | null> {
    const [rows] = await this.listAndCountBids({ id } as any, { take: 1 }).catch(() => [[]]);
    return ((rows as SHCBid[])?.[0] as SHCBid) || null;
  }
}

export default ShcBidModuleService;
