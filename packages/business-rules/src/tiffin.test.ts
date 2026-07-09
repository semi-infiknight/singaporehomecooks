import { describe, expect, it } from "vitest";
import {
  assertOneKitchenSubscription,
  validateWeeklyPlanSlots,
  resolvePlanForWeek,
  weekStartMonday,
  collectionDateForWeek,
} from "./tiffin";

describe("tiffin business rules", () => {
  it("blocks switching kitchens while active", () => {
    const r = assertOneKitchenSubscription("cook_a", "cook_b");
    expect(r.ok).toBe(false);
    expect(assertOneKitchenSubscription(null, "cook_b").ok).toBe(true);
    expect(assertOneKitchenSubscription("cook_a", "cook_a").ok).toBe(true);
  });

  it("validates slot count and eligible dishes", () => {
    const eligible = ["dish_1", "dish_2"];
    const days = [1, 2, 3, 4, 5];
    expect(
      validateWeeklyPlanSlots(
        [
          { day_of_week: 1, product_id: "dish_1" },
          { day_of_week: 3, product_id: "dish_2" },
        ],
        2,
        eligible,
        days
      ).ok
    ).toBe(true);
    expect(
      validateWeeklyPlanSlots([{ day_of_week: 1, product_id: "dish_x" }], 2, eligible, days).ok
    ).toBe(false);
    expect(
      validateWeeklyPlanSlots(
        [
          { day_of_week: 1, product_id: "dish_1" },
          { day_of_week: 1, product_id: "dish_2" },
        ],
        2,
        eligible,
        days
      ).ok
    ).toBe(false);
  });

  it("resolves override before template", () => {
    const plans = [
      { week_start: null, slots: [{ day_of_week: 1, product_id: "tpl" }] },
      { week_start: "2026-07-06", slots: [{ day_of_week: 2, product_id: "override" }] },
    ];
    expect(resolvePlanForWeek(plans, "2026-07-06")[0].product_id).toBe("override");
    expect(resolvePlanForWeek(plans, "2026-07-13")[0].product_id).toBe("tpl");
  });

  it("maps collection dates from Monday week start", () => {
    const monday = weekStartMonday(new Date("2026-07-08T12:00:00.000Z"));
    expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(collectionDateForWeek("2026-07-06", 1)).toBe("2026-07-06");
    expect(collectionDateForWeek("2026-07-06", 3)).toBe("2026-07-08");
  });
});