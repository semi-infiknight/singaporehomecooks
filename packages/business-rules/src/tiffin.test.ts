import { describe, expect, it } from "vitest";
import {
  assertOneKitchenSubscription,
  validateWeeklyPlanSlots,
  resolvePlanForWeek,
  weekStartMonday,
  collectionDateForWeek,
  defaultFlexQuota,
  canMutateTiffinOrder,
  canSkipTiffinMeal,
  canCustomizeTiffinMeal,
  canPauseSubscription,
  applyPause,
  canResumeSubscription,
  subscriptionCardKind,
  projectMealInstances,
  TIFFIN_CUSTOMIZE_CUTOFF_HOURS,
  slotStartUtc,
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

  it("computes HomelyEats flex quota from meals_per_week", () => {
    expect(defaultFlexQuota(2)).toBe(2);
    expect(defaultFlexQuota(3)).toBe(2);
    expect(defaultFlexQuota(4)).toBe(3);
  });

  it("enforces 8h cutoff for skip/customize (HomelyEats)", () => {
    expect(TIFFIN_CUSTOMIZE_CUTOFF_HOURS).toBe(8);
    const slot = slotStartUtc("2026-07-10", "18:00-19:00");
    const farBefore = new Date(slot.getTime() - 10 * 3600_000);
    const tooLate = new Date(slot.getTime() - 2 * 3600_000);
    expect(canMutateTiffinOrder(slot, farBefore)).toBe(true);
    expect(canMutateTiffinOrder(slot, tooLate)).toBe(false);

    const skipOk = canSkipTiffinMeal({
      flexRemaining: 2,
      collectionDate: "2026-07-10",
      collectionSlot: "18:00-19:00",
      now: farBefore,
    });
    expect(skipOk.ok).toBe(true);

    const skipNoFlex = canSkipTiffinMeal({
      flexRemaining: 0,
      collectionDate: "2026-07-10",
      collectionSlot: "18:00-19:00",
      now: farBefore,
    });
    expect(skipNoFlex.ok).toBe(false);

    const customizeLate = canCustomizeTiffinMeal({
      collectionDate: "2026-07-10",
      collectionSlot: "18:00-19:00",
      now: tooLate,
    });
    expect(customizeLate.ok).toBe(false);
  });

  it("pause consumes flex and extends expiry", () => {
    expect(canPauseSubscription({ status: "active", flexRemaining: 3, pauseDays: 2 }).ok).toBe(true);
    expect(canPauseSubscription({ status: "paused", flexRemaining: 3, pauseDays: 1 }).ok).toBe(false);
    expect(canPauseSubscription({ status: "active", flexRemaining: 1, pauseDays: 2 }).ok).toBe(false);

    const applied = applyPause({
      flexRemaining: 3,
      pauseDays: 2,
      now: new Date("2026-07-09T12:00:00.000Z"),
      expiresOn: "2026-08-01",
    });
    expect(applied.flexRemaining).toBe(1);
    expect(applied.pausedUntil).toBe("2026-07-11");
    expect(applied.expiresOn).toBe("2026-08-03");
    expect(canResumeSubscription("paused").ok).toBe(true);
    expect(canResumeSubscription("active").ok).toBe(false);
  });

  it("derives subscription card kinds for manage UI", () => {
    expect(subscriptionCardKind({ status: "active" })).toBe("active");
    expect(subscriptionCardKind({ status: "paused" })).toBe("paused");
    expect(subscriptionCardKind({ status: "cancelled" })).toBe("canceled");
    expect(
      subscriptionCardKind({
        status: "active",
        expiresOn: "2026-07-10",
        now: new Date("2026-07-09T12:00:00.000Z"),
      })
    ).toBe("expires_soon");
  });

  it("projects calendar meal instances from weekly plans", () => {
    const instances = projectMealInstances({
      subscriptionId: "sub_1",
      cookId: "cook_rose",
      fromIso: "2026-07-06",
      toIso: "2026-07-12",
      plans: [
        {
          week_start: null,
          slots: [
            { day_of_week: 1, product_id: "dish_a" },
            { day_of_week: 3, product_id: "dish_b" },
          ],
        },
      ],
      defaultSlot: "18:00-19:00",
      now: new Date("2026-07-01T12:00:00.000Z"),
      skippedDates: new Set(["2026-07-08"]),
    });
    expect(instances.length).toBe(2);
    expect(instances.find((i) => i.collection_date === "2026-07-06")?.product_id).toBe("dish_a");
    expect(instances.find((i) => i.collection_date === "2026-07-08")?.status).toBe("skipped");
  });
});
