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
  customizeWalletAdjustCents,
  canPauseSubscription,
  applyPause,
  applyRecharge,
  canRechargeSubscription,
  subscriptionCardCopy,
  pauseDayOptions,
  rechargeWeekOptions,
  tiffinRechargeAmountCents,
  formatTiffinLedgerAmount,
  canResumeSubscription,
  subscriptionCardKind,
  projectMealInstances,
  TIFFIN_CUSTOMIZE_CUTOFF_HOURS,
  slotStartUtc,
  effectiveSubscriptionStatus,
  isPauseWindowActive,
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

  it("customize wallet charges only delta on re-customize (absolute amount upsert)", () => {
    // first extras S$2.00
    expect(customizeWalletAdjustCents(200, 0)).toBe(200);
    // same total again → no double charge
    expect(customizeWalletAdjustCents(200, 200)).toBe(0);
    // increase to S$3.50 → debit 150
    expect(customizeWalletAdjustCents(350, 200)).toBe(150);
    // reduce to S$1.00 → credit 100
    expect(customizeWalletAdjustCents(100, 200)).toBe(-100);
    // floor negatives / floats
    expect(customizeWalletAdjustCents(-5, 50)).toBe(-50);
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

  it("recharge extends expiry, restores flex, adds meals", () => {
    expect(canRechargeSubscription({ status: "active", weeks: 4 }).ok).toBe(true);
    expect(canRechargeSubscription({ status: "canceled", weeks: 1 }).ok).toBe(false);
    expect(canRechargeSubscription({ status: "active", weeks: 0 }).ok).toBe(false);
    const r = applyRecharge({
      mealsPerWeek: 3,
      weeks: 4,
      flexQuota: 2,
      flexRemaining: 0,
      deliveriesLeft: 2,
      expiresOn: "2026-08-01",
      now: new Date("2026-07-09T12:00:00.000Z"),
    });
    expect(r.mealsAdded).toBe(12);
    expect(r.deliveriesLeft).toBe(14);
    expect(r.flexRemaining).toBe(defaultFlexQuota(3));
    expect(r.expiresOn).toBe("2026-08-29");
    expect(subscriptionCardCopy("expires_soon").showRecharge).toBe(true);
    expect(subscriptionCardCopy("paused").primaryCta).toMatch(/Resume/i);
    expect(pauseDayOptions(3)).toEqual([1, 2, 3]);
    expect(rechargeWeekOptions()).toEqual([1, 2, 4]);
  });

  it("recharge amount cents and ledger amount format", () => {
    // 3 meals × S$11 × 4 weeks = 132 → 13200 cents
    expect(tiffinRechargeAmountCents(3, 4)).toBe(13200);
    expect(formatTiffinLedgerAmount(13200, "recharge")).toBe("S$132.00");
    expect(formatTiffinLedgerAmount(-500, "meal")).toBe("−S$5.00");
    expect(formatTiffinLedgerAmount(0, "flex")).toBe("—");
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

  it("marks past collection slots as delivered (not scheduled)", () => {
    // 2026-06-01 is Monday → day_of_week 1; slot 18:00 already past when now is July
    const instances = projectMealInstances({
      subscriptionId: "sub_past",
      cookId: "cook_rose",
      fromIso: "2026-06-01",
      toIso: "2026-06-07",
      plans: [
        {
          week_start: null,
          slots: [{ day_of_week: 1, product_id: "dish_a", collection_slot: "18:00-19:00" }],
        },
      ],
      now: new Date("2026-07-09T12:00:00.000Z"),
    });
    expect(instances.length).toBeGreaterThan(0);
    const june1 = instances.find((i) => i.collection_date === "2026-06-01");
    expect(june1).toBeDefined();
    expect(june1!.status).toBe("delivered");
    expect(june1!.status).not.toBe("scheduled");
  });

  it("treats expired paused_until as active for pause/resume gates", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    expect(isPauseWindowActive("2026-07-08", now)).toBe(false);
    expect(isPauseWindowActive("2026-07-10", now)).toBe(true);

    expect(
      effectiveSubscriptionStatus({
        dbStatus: "active",
        pausedUntil: "2026-07-08",
        now,
      })
    ).toBe("active");
    expect(
      effectiveSubscriptionStatus({
        dbStatus: "active",
        pausedUntil: "2026-07-10",
        now,
      })
    ).toBe("paused");

    // After pause window elapsed: can pause again, cannot resume
    const effective = effectiveSubscriptionStatus({
      dbStatus: "active",
      pausedUntil: "2026-07-08",
      now,
    });
    expect(canPauseSubscription({ status: effective, flexRemaining: 2, pauseDays: 1 }).ok).toBe(true);
    expect(canResumeSubscription(effective).ok).toBe(false);

    // While still paused: cannot pause again, can resume
    const stillPaused = effectiveSubscriptionStatus({
      dbStatus: "active",
      pausedUntil: "2026-07-15",
      now,
    });
    expect(canPauseSubscription({ status: stillPaused, flexRemaining: 2, pauseDays: 1 }).ok).toBe(false);
    expect(canResumeSubscription(stillPaused).ok).toBe(true);
  });
});
