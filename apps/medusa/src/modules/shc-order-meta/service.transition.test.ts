import { describe, expect, it, vi, beforeEach } from "vitest";
import ShcOrderMetaModuleService from "./service";

describe("ShcOrderMetaModuleService.transitionOrderState", () => {
  let service: ShcOrderMetaModuleService;

  beforeEach(() => {
    service = Object.create(ShcOrderMetaModuleService.prototype);
    vi.restoreAllMocks();
  });

  it("rejects transition when actor cook_id does not match order cook_id", async () => {
    const orderMeta = {
      order_id: "SHC-123",
      cook_id: "cook_owner",
      shc_status: "paid",
    };
    vi.spyOn(service as any, "listAndCountOrderMetas").mockResolvedValue([[orderMeta], 1]);

    const result = await service.transitionOrderState("SHC-123", "accepted", "cook_intruder");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/own/i);
  });

  it("allows transition when actor matches order cook_id", async () => {
    // State machine: cook accepts from cart (before payment), not from paid.
    const orderMeta = {
      order_id: "SHC-123",
      cook_id: "cook_owner",
      shc_status: "cart",
    };
    const updated = { ...orderMeta, shc_status: "accepted" };
    vi.spyOn(service as any, "listAndCountOrderMetas").mockResolvedValue([[orderMeta], 1]);
    vi.spyOn(service as any, "updateOrderMetas").mockResolvedValue([updated]);

    const result = await service.transitionOrderState("SHC-123", "accepted", "cook_owner");
    expect(result.valid).toBe(true);
    expect(result.meta?.shc_status).toBe("accepted");
  });
});