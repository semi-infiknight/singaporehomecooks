import { describe, expect, it } from "vitest";
import ShcPayoutBatchModuleService from "./service";

function makePayoutService(overrides: Record<string, unknown> = {}) {
  return Object.assign(Object.create(ShcPayoutBatchModuleService.prototype), overrides) as any;
}

describe("ShcPayoutBatchModuleService", () => {
  it("reuses an existing weekly batch by week_start", async () => {
    const existing = { id: "batch_1", week_start: "2026-07-06", status: "pending" };
    let listArgs: any;
    let createCalled = false;
    const service = makePayoutService({
      listPayoutBatches: async (filters: any) => {
        listArgs = filters;
        return [existing];
      },
      createPayoutBatches: async () => {
        createCalled = true;
        return [];
      },
    });

    const batch = await service.createOrGetWeeklyBatch("2026-07-06", 12000);

    expect(listArgs).toEqual({ week_start: "2026-07-06" });
    expect(batch).toBe(existing);
    expect(createCalled).toBe(false);
  });

  it("approves pending payout batches by id", async () => {
    let listArgs: any;
    let updatePayload: any;
    const service = makePayoutService({
      listPayoutBatches: async (filters: any) => {
        listArgs = filters;
        return [{ id: "batch_1", week_start: "2026-07-06", status: "pending" }];
      },
      updatePayoutBatches: async (payload: any) => {
        updatePayload = payload;
        return [{ id: payload.selector.id, ...payload.data }];
      },
    });

    const approved = await service.approvePayoutBatch("batch_1", "ops");

    expect(listArgs).toEqual({ id: "batch_1" });
    expect(updatePayload.selector.id).toBe("batch_1");
    expect(approved.status).toBe("approved");
    expect(approved.transfer_ref).toMatch(/^SIM-PAYOUT-/);
  });
});
