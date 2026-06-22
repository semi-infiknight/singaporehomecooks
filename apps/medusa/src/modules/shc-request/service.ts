import { MedusaService } from "@medusajs/framework/utils";
import { Request } from "./models/request";
import { SHCRequest, shcRequestSchema, createSHCError } from "@shc/types";

/**
 * shc-request module.
 * Supports Phase 8/9 growth: customer recipe requests (open/bidding/matched).
 * Uses frozen shcRequestSchema. Emits events for bids/accept. Production: rate limit + audit in routes.
 */
class ShcRequestModuleService extends MedusaService({ Request }) {
  async createRequest(data: Partial<SHCRequest>): Promise<SHCRequest> {
    const validated = shcRequestSchema.partial().parse(data);
    if (!validated.body || validated.body.length < 10) {
      throw createSHCError("SHC-REQ-001", "Request body must be descriptive (>=10 chars)");
    }
    const [created] = await this.createRequests([{
      ...validated,
      status: validated.status || "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any]);
    return created as unknown as SHCRequest;
  }

  async listOpenRequests(filters: { limit?: number } = {}): Promise<SHCRequest[]> {
    const [reqs] = await this.listAndCountRequests({ status: ["open", "bidding"] } as any, {
      take: filters.limit || 50,
      order: { created_at: "DESC" },
    }).catch(() => [[]]);
    return reqs as unknown as SHCRequest[];
  }

  async getRequest(id: string): Promise<SHCRequest | null> {
    const [rows] = await this.listAndCountRequests({ id } as any, { take: 1 }).catch(() => [[]]);
    return ((rows as SHCRequest[])?.[0] as SHCRequest) || null;
  }

  async updateRequestStatus(id: string, status: SHCRequest["status"]): Promise<SHCRequest> {
    const [updated] = await this.updateRequests({
      selector: { id },
      data: { status, updated_at: new Date() } as any,
    });
    return updated as unknown as SHCRequest;
  }
}

export default ShcRequestModuleService;
