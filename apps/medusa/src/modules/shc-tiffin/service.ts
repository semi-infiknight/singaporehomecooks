import { MedusaService } from "@medusajs/framework/utils";
import { createSHCError } from "@shc/types";
import {
  assertOneKitchenSubscription,
  resolvePlanForWeek,
  validateWeeklyPlanSlots,
  weekStartMonday,
  type TiffinPlanSlot,
} from "@shc/business-rules";
import { TiffinKitchenConfig } from "./models/kitchen-config";
import { TiffinSubscription } from "./models/subscription";
import { TiffinWeeklyPlan } from "./models/weekly-plan";

export type TiffinKitchenConfigDTO = {
  cook_id: string;
  enabled: boolean;
  tagline?: string | null;
  eligible_product_ids: string[];
  meals_per_week_options: number[];
  collection_days: number[];
  default_collection_slot: string;
};

class ShcTiffinModuleService extends MedusaService({
  TiffinKitchenConfig,
  TiffinSubscription,
  TiffinWeeklyPlan,
}) {
  async getKitchenConfig(cookId: string): Promise<TiffinKitchenConfigDTO | null> {
    const [rows] = await this.listAndCountTiffinKitchenConfigs({ cook_id: cookId } as any, { take: 1 }).catch(() => [[]]);
    const row = (rows as any[])?.[0];
    if (!row) return null;
    return this.shapeKitchen(row);
  }

  async upsertKitchenConfig(cookId: string, data: Partial<TiffinKitchenConfigDTO>): Promise<TiffinKitchenConfigDTO> {
    const existing = await this.getKitchenConfig(cookId);
    const payload = {
      cook_id: cookId,
      enabled: data.enabled ?? existing?.enabled ?? false,
      tagline: data.tagline ?? existing?.tagline ?? null,
      eligible_product_ids: data.eligible_product_ids ?? existing?.eligible_product_ids ?? [],
      meals_per_week_options: data.meals_per_week_options ?? existing?.meals_per_week_options ?? [2, 3, 4],
      collection_days: data.collection_days ?? existing?.collection_days ?? [1, 2, 3, 4, 5],
      default_collection_slot: data.default_collection_slot ?? existing?.default_collection_slot ?? "18:00-19:00",
      updated_at: new Date(),
    };
    if (existing) {
      await this.updateTiffinKitchenConfigs({
        selector: { cook_id: cookId },
        data: payload as any,
      });
    } else {
      await this.createTiffinKitchenConfigs([{ ...payload, created_at: new Date() } as any]);
    }
    return (await this.getKitchenConfig(cookId))!;
  }

  async listEnabledKitchens(): Promise<TiffinKitchenConfigDTO[]> {
    const [rows] = await this.listAndCountTiffinKitchenConfigs({ enabled: true } as any, { take: 100 }).catch(() => [[]]);
    return (rows as any[]).map((r) => this.shapeKitchen(r));
  }

  async getActiveSubscription(customerId: string) {
    const [rows] = await this.listAndCountTiffinSubscriptions(
      { customer_id: customerId, status: "active" } as any,
      { take: 1 }
    ).catch(() => [[]]);
    return (rows as any[])?.[0] || null;
  }

  async createSubscription(customerId: string, cookId: string, mealsPerWeek: number) {
    const active = await this.getActiveSubscription(customerId);
    const gate = assertOneKitchenSubscription(active?.cook_id, cookId);
    if (!gate.ok) throw createSHCError("SHC-GENERIC-001", gate.message);

    const config = await this.getKitchenConfig(cookId);
    if (!config?.enabled) throw createSHCError("SHC-GENERIC-001", "This kitchen does not offer tiffin subscription.");

    if (!config.meals_per_week_options.includes(mealsPerWeek)) {
      throw createSHCError("SHC-GENERIC-001", "Invalid meals-per-week option for this kitchen.");
    }

    if (active) {
      await this.updateTiffinSubscriptions({
        selector: { id: active.id },
        data: { meals_per_week: mealsPerWeek, cook_id: cookId, updated_at: new Date() } as any,
      });
      const [updated] = await this.listAndCountTiffinSubscriptions({ id: active.id } as any, { take: 1 });
      return (updated as any[])?.[0];
    }

    const id = `tiffin_sub_${Date.now()}`;
    const [created] = await this.createTiffinSubscriptions([
      {
        id,
        customer_id: customerId,
        cook_id: cookId,
        meals_per_week: mealsPerWeek,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    ]);
    await this.createTiffinWeeklyPlans([
      {
        id: `tiffin_plan_tpl_${id}`,
        subscription_id: id,
        week_start: null,
        slots: [],
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    ]);
    return created;
  }

  async cancelSubscription(customerId: string) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) return null;
    await this.updateTiffinSubscriptions({
      selector: { id: active.id },
      data: { status: "cancelled", updated_at: new Date() } as any,
    });
    return active;
  }

  async listPlans(subscriptionId: string) {
    const [rows] = await this.listAndCountTiffinWeeklyPlans({ subscription_id: subscriptionId } as any, { take: 20 }).catch(
      () => [[]]
    );
    return (rows as any[]).map((r) => ({
      id: r.id,
      subscription_id: r.subscription_id,
      week_start: r.week_start,
      slots: (r.slots || []) as TiffinPlanSlot[],
    }));
  }

  async saveWeeklyPlan(
    subscriptionId: string,
    input: { slots: TiffinPlanSlot[]; week_start?: string | null; as_recurring_template?: boolean },
    context: { mealsPerWeek: number; eligibleProductIds: string[]; collectionDays: number[] }
  ) {
    const validation = validateWeeklyPlanSlots(
      input.slots,
      context.mealsPerWeek,
      context.eligibleProductIds,
      context.collectionDays
    );
    if (!validation.ok) throw createSHCError("SHC-GENERIC-001", validation.message);

    const weekKey = input.as_recurring_template ? null : input.week_start ?? weekStartMonday();

    const plans = await this.listPlans(subscriptionId);
    const existing = plans.find((p) => p.week_start === weekKey);
    const payload = {
      subscription_id: subscriptionId,
      week_start: weekKey,
      slots: input.slots,
      updated_at: new Date(),
    };

    if (existing) {
      await this.updateTiffinWeeklyPlans({
        selector: { id: existing.id },
        data: payload as any,
      });
      return { ...existing, slots: input.slots };
    }

    const [created] = await this.createTiffinWeeklyPlans([
      { id: `tiffin_plan_${Date.now()}`, ...payload, created_at: new Date() } as any,
    ]);
    return created;
  }

  resolveSlotsForWeek(plans: { week_start: string | null; slots: TiffinPlanSlot[] }[], weekStart: string) {
    return resolvePlanForWeek(plans, weekStart);
  }

  private shapeKitchen(row: any): TiffinKitchenConfigDTO {
    return {
      cook_id: row.cook_id,
      enabled: !!row.enabled,
      tagline: row.tagline,
      eligible_product_ids: row.eligible_product_ids || [],
      meals_per_week_options: row.meals_per_week_options || [2, 3, 4],
      collection_days: row.collection_days || [1, 2, 3, 4, 5],
      default_collection_slot: row.default_collection_slot || "18:00-19:00",
    };
  }
}

export default ShcTiffinModuleService;