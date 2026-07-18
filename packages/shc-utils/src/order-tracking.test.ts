import { describe, expect, it } from "vitest";
import { isCookNeedsActionOrder, partitionCookOrders } from "./order-tracking";

describe("partitionCookOrders", () => {
  it("puts paid orders in needsAction", () => {
    const orders = [
      { id: "1", shc_status: "paid" },
      { id: "2", shc_status: "preparing" },
      { id: "3", shc_status: "completed" },
    ];
    const { needsAction, inProgress, done } = partitionCookOrders(orders);
    expect(needsAction.map((o) => o.id)).toEqual(["1"]);
    expect(inProgress.map((o) => o.id)).toEqual(["2"]);
    expect(done.map((o) => o.id)).toEqual(["3"]);
  });

  it("isCookNeedsActionOrder is true only for paid", () => {
    expect(isCookNeedsActionOrder({ shc_status: "paid" })).toBe(true);
    expect(isCookNeedsActionOrder({ shc_status: "accepted" })).toBe(false);
  });
});
