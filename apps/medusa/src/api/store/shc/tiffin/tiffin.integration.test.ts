import { describe, expect, it } from "vitest";
import { validateWeeklyPlanSlots } from "@shc/business-rules";
import { GET as getKitchens } from "./kitchens/route";
import { GET as getSub, POST as postSub } from "./subscription/route";
import { PUT as putPlan } from "./weekly-plan/route";
import { PUT as putNextWeek } from "./weekly-plan/next-week/route";
import { GET as getCookConfig, PUT as putCookConfig } from "./cook/config/route";
import { signShcToken } from "../../../../lib/shc-auth";

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

function mockTiffinScope() {
  const store: Record<string, any> = {
    configs: new Map<string, any>(),
    subs: new Map<string, any>(),
    plans: new Map<string, any[]>(),
  };

  const tiffin = {
    async getKitchenConfig(cookId: string) {
      return store.configs.get(cookId) || null;
    },
    async upsertKitchenConfig(cookId: string, data: any) {
      const existing = store.configs.get(cookId) || {
        cook_id: cookId,
        enabled: false,
        eligible_product_ids: [],
        meals_per_week_options: [2, 3, 4],
        collection_days: [1, 2, 3, 4, 5],
        default_collection_slot: "18:00-19:00",
      };
      const next = { ...existing, ...data, cook_id: cookId };
      store.configs.set(cookId, next);
      return next;
    },
    async listEnabledKitchens() {
      return [...store.configs.values()].filter((c) => c.enabled);
    },
    async getActiveSubscription(customerId: string) {
      return [...store.subs.values()].find((s) => s.customer_id === customerId && s.status === "active") || null;
    },
    async createSubscription(customerId: string, cookId: string, mealsPerWeek: number) {
      const active = await this.getActiveSubscription(customerId);
      if (active && active.cook_id !== cookId) {
        const err: any = new Error("kitchen conflict");
        err.code = "SHC-GENERIC-001";
        throw err;
      }
      const config = store.configs.get(cookId);
      if (!config?.enabled) {
        const err: any = new Error("not enabled");
        err.code = "SHC-GENERIC-001";
        throw err;
      }
      if (active) {
        active.meals_per_week = mealsPerWeek;
        return active;
      }
      const sub = {
        id: `tiffin_sub_test`,
        customer_id: customerId,
        cook_id: cookId,
        meals_per_week: mealsPerWeek,
        status: "active",
      };
      store.subs.set(sub.id, sub);
      store.plans.set(sub.id, [{ id: "tpl", subscription_id: sub.id, week_start: null, slots: [] }]);
      return sub;
    },
    async listPlans(subscriptionId: string) {
      return store.plans.get(subscriptionId) || [];
    },
    async saveWeeklyPlan(subId: string, input: any, ctx: any) {
      const gate = validateWeeklyPlanSlots(
        input.slots,
        ctx.mealsPerWeek,
        ctx.eligibleProductIds,
        ctx.collectionDays
      );
      if (!gate.ok) {
        const err: any = new Error(gate.message);
        err.code = "SHC-GENERIC-001";
        throw err;
      }
      const plans = store.plans.get(subId) || [];
      const weekKey = input.as_recurring_template ? null : input.week_start;
      const existing = plans.find((p: any) => p.week_start === weekKey);
      if (existing) {
        existing.slots = input.slots;
        return existing;
      }
      const plan = { id: `plan_${Date.now()}`, subscription_id: subId, week_start: weekKey, slots: input.slots };
      plans.push(plan);
      store.plans.set(subId, plans);
      return plan;
    },
    resolveSlotsForWeek(plans: any[], weekStart: string) {
      const override = plans.find((p) => p.week_start === weekStart);
      if (override) return override.slots;
      const template = plans.find((p) => p.week_start === null);
      return template?.slots || [];
    },
  };

  return {
    tiffin,
    scope: {
      resolve(name: string) {
        if (name === "shcTiffin") return tiffin;
        if (name === "shcCook") {
          return {
            listAndCountCooks: async () => [[{ id: "cook_1", display_name: "Rose", area: "Tampines", slug: "rose" }]],
          };
        }
        if (name === "shcProductMeta") {
          return {
            getMetaForProduct: async (pid: string) =>
              pid ? { product_id: pid, title: "Dish", price_cents: 1200, cook_id: "cook_1" } : null,
          };
        }
        if (name === "shcAvailability") {
          return { getAvailability: async () => null };
        }
        if (name === "logger") return console;
        throw new Error(`unknown ${name}`);
      },
    },
    store,
  };
}

describe("tiffin subscription flow", () => {
  it("cook config → subscribe → template plan → next-week override", async () => {
    const { scope, store, tiffin } = mockTiffinScope();
    const cookToken = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const custToken = signShcToken({ actor_type: "customer", actor_id: "cust_1", shc: true });

    const cookPutRes = makeRes();
    await putCookConfig(
      { headers: { authorization: `Bearer ${cookToken}` }, body: { enabled: true, eligible_product_ids: ["dish_1", "dish_2"] }, scope } as any,
      cookPutRes
    );
    expect(cookPutRes.body.config.enabled).toBe(true);

    const kitchensRes = makeRes();
    await getKitchens({ scope } as any, kitchensRes);
    expect(kitchensRes.body.kitchens).toHaveLength(1);

    const subRes = makeRes();
    await postSub(
      {
        headers: { authorization: `Bearer ${custToken}` },
        body: { cook_id: "cook_1", meals_per_week: 3 },
        scope,
      } as any,
      subRes
    );
    expect(subRes.statusCode).toBe(201);
    expect(subRes.body.subscription.meals_per_week).toBe(3);

    const planRes = makeRes();
    await putPlan(
      {
        headers: { authorization: `Bearer ${custToken}` },
        body: {
          slots: [
            { day_of_week: 1, product_id: "dish_1" },
            { day_of_week: 3, product_id: "dish_2" },
            { day_of_week: 5, product_id: "dish_1" },
          ],
          as_recurring_template: true,
        },
        scope,
      } as any,
      planRes
    );
    expect(planRes.body.plan.slots).toHaveLength(3);

    const nextRes = makeRes();
    await putNextWeek(
      {
        headers: { authorization: `Bearer ${custToken}` },
        body: {
          slots: [
            { day_of_week: 2, product_id: "dish_2" },
            { day_of_week: 4, product_id: "dish_1" },
            { day_of_week: 5, product_id: "dish_2" },
          ],
        },
        scope,
      } as any,
      nextRes
    );
    expect(nextRes.body.plan.slots).toHaveLength(3);

    const getSubRes = makeRes();
    await getSub({ headers: { authorization: `Bearer ${custToken}` }, scope } as any, getSubRes);
    expect(getSubRes.body.slots_current_week).toHaveLength(3);
    expect(getSubRes.body.slots_next_week).toHaveLength(3);
    expect(getSubRes.body.slots_next_week[0].day_of_week).toBe(2);

    const cookGetRes = makeRes();
    await getCookConfig({ headers: { authorization: `Bearer ${cookToken}` }, scope } as any, cookGetRes);
    expect(cookGetRes.body.config.cook_id).toBe("cook_1");
    expect(store.configs.get("cook_1").eligible_product_ids).toContain("dish_1");
  });
});