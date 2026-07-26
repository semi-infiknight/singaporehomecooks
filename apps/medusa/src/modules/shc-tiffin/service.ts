import { MedusaService } from "@medusajs/framework/utils";
import { createSHCError } from "@shc/types";
import {
  assertOneKitchenSubscription,
  resolvePlanForWeek,
  validateWeeklyPlanSlots,
  weekStartMonday,
  canSkipTiffinMeal,
  canCustomizeTiffinMeal,
  canPauseSubscription,
  canResumeSubscription,
  canRechargeSubscription,
  applyPause,
  applyRecharge,
  projectMealInstances,
  defaultFlexQuota,
  effectiveSubscriptionStatus,
  isPauseWindowActive,
  tiffinRechargeAmountCents,
  addDaysIso,
  customizeWalletAdjustCents,
  type TiffinPlanSlot,
} from "@shc/business-rules";
import { TiffinKitchenConfig } from "./models/kitchen-config";
import { TiffinSubscription } from "./models/subscription";
import { TiffinWeeklyPlan } from "./models/weekly-plan";
import {
  pgGetKitchenConfig,
  pgListEnabledKitchens,
  pgUpsertKitchenConfig,
  pgEnsureSubMeta,
  pgUpdateSubMeta,
  pgListSkips,
  pgAddSkip,
  pgListKitchenCancels,
  pgAddKitchenCancel,
  pgUpsertDayMenu,
  pgGetDayMenu,
  pgCountActiveSubscribers,
  pgAddTiffinLedger,
  pgListTiffinLedger,
  pgGetActiveSubscription,
  pgCreateOrUpdateSubscription,
  pgSetSubscriptionStatus,
  pgListPastSubscriptions,
  pgUpsertMealCustom,
  pgListMealCustoms,
  pgGetMealCustom,
} from "../../lib/shc-tiffin-pg";

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
  /** Kitchen config uses direct pg — MikroORM list was empty on Railway despite SQL rows. */
  async getKitchenConfig(cookId: string): Promise<TiffinKitchenConfigDTO | null> {
    try {
      return await pgGetKitchenConfig(cookId);
    } catch {
      const [rows] = await this.listAndCountTiffinKitchenConfigs({ cook_id: cookId } as any, { take: 1 }).catch(() => [[]]);
      const row = (rows as any[])?.[0];
      if (!row) return null;
      return this.shapeKitchen(row);
    }
  }

  async upsertKitchenConfig(cookId: string, data: Partial<TiffinKitchenConfigDTO>): Promise<TiffinKitchenConfigDTO> {
    try {
      return await pgUpsertKitchenConfig(cookId, data);
    } catch (e) {
      // Fallback MikroORM path (local dev without DATABASE_URL quirks)
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
        await this.createTiffinKitchenConfigs([
          { id: `tiffin_cfg_${cookId}`, ...payload, created_at: new Date() } as any,
        ]);
      }
      return (await this.getKitchenConfig(cookId))!;
    }
  }

  async listEnabledKitchens(): Promise<TiffinKitchenConfigDTO[]> {
    try {
      return await pgListEnabledKitchens();
    } catch {
      const [rows] = await this.listAndCountTiffinKitchenConfigs({ enabled: true } as any, { take: 100 }).catch(() => [[]]);
      return (rows as any[]).map((r) => this.shapeKitchen(r));
    }
  }

  async getActiveSubscription(customerId: string) {
    // Prefer direct Postgres — MikroORM list empty/unreliable on Railway (same pattern as kitchens)
    try {
      const row = await pgGetActiveSubscription(customerId);
      if (row) return row;
    } catch {
      /* fall through */
    }
    const [rows] = await this.listAndCountTiffinSubscriptions(
      { customer_id: customerId, status: "active" } as any,
      { take: 1 }
    ).catch(() => [[]]);
    return (rows as any[])?.[0] || null;
  }

  async createSubscription(
    customerId: string,
    cookId: string,
    mealsPerWeek: number,
    weeks = 4
  ) {
    const periodWeeks = Math.min(12, Math.max(1, Math.floor(Number(weeks) || 4)));
    const active = await this.getActiveSubscription(customerId);
    const gate = assertOneKitchenSubscription(active?.cook_id, cookId);
    if (!gate.ok) {
      const err = createSHCError("SHC-GENERIC-001", gate.message);
      throw Object.assign(new Error(err.message), err);
    }

    const config = await this.getKitchenConfig(cookId);
    if (!config?.enabled) {
      const err = createSHCError("SHC-GENERIC-001", "This kitchen does not offer tiffin subscription.");
      throw Object.assign(new Error(err.message), err);
    }

    if (!config.meals_per_week_options.includes(mealsPerWeek)) {
      const err = createSHCError("SHC-GENERIC-001", "Invalid meals-per-week option for this kitchen.");
      throw Object.assign(new Error(err.message), err);
    }

    let created: any = null;
    // Wave 7: Postgres-first create (MikroORM create often fails silently / throws on Railway)
    try {
      created = await pgCreateOrUpdateSubscription({
        customerId,
        cookId,
        mealsPerWeek,
      });
    } catch (pgErr: any) {
      // fallback MikroORM
      try {
        if (active) {
          await this.updateTiffinSubscriptions({
            selector: { id: active.id },
            data: { meals_per_week: mealsPerWeek, cook_id: cookId, updated_at: new Date() } as any,
          });
          const [updated] = await this.listAndCountTiffinSubscriptions({ id: active.id } as any, { take: 1 });
          created = (updated as any[])?.[0];
        } else {
          const id = `tiffin_sub_${Date.now()}`;
          const [row] = await this.createTiffinSubscriptions([
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
          created = row;
        }
      } catch (ormErr: any) {
        throw Object.assign(
          new Error(pgErr?.message || ormErr?.message || "Failed to create tiffin subscription"),
          createSHCError("SHC-GENERIC-001", pgErr?.message || ormErr?.message || "Failed to create tiffin subscription")
        );
      }
    }

    if (!created?.id) {
      throw Object.assign(
        new Error("Subscription create returned empty"),
        createSHCError("SHC-GENERIC-001", "Subscription create returned empty")
      );
    }

    try {
      await pgEnsureSubMeta(created.id, mealsPerWeek);
      const openCents = tiffinRechargeAmountCents(mealsPerWeek, periodWeeks);
      const openDeliveries = mealsPerWeek * periodWeeks;
      const today = new Date().toISOString().slice(0, 10);
      // only set opening balance when new or zero
      const meta = await pgEnsureSubMeta(created.id, mealsPerWeek);
      if (!meta.balance_cents || meta.balance_cents <= 0) {
        await pgUpdateSubMeta(created.id, {
          balance_cents: openCents,
          deliveries_left: openDeliveries,
          expires_on: addDaysIso(today, periodWeeks * 7),
        });
        await pgAddTiffinLedger({
          subscriptionId: created.id,
          kind: "opening",
          label: `Plan opened · ${mealsPerWeek} meals/wk · ${periodWeeks} week${periodWeeks === 1 ? "" : "s"}`,
          amountCents: openCents,
          deltaDeliveries: openDeliveries,
          deltaFlex: defaultFlexQuota(mealsPerWeek),
          paynowRef: `OPEN-${created.id.slice(-8)}`,
        });
      } else {
        await pgUpdateSubMeta(created.id, {
          /* keep balance; refresh deliveries floor */
          deliveries_left: Math.max(meta.deliveries_left ?? 0, mealsPerWeek),
        });
      }
    } catch {
      /* meta optional if DATABASE_URL missing in unit tests */
    }
    return created;
  }

  async listPastSubscriptions(customerId: string) {
    try {
      return await pgListPastSubscriptions(customerId);
    } catch {
      return [];
    }
  }

  async cancelSubscription(customerId: string, reason?: string) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) return null;
    try {
      await pgSetSubscriptionStatus(active.id, "cancelled");
    } catch {
      await this.updateTiffinSubscriptions({
        selector: { id: active.id },
        data: { status: "cancelled", updated_at: new Date() } as any,
      }).catch(() => {});
    }
    try {
      await pgEnsureSubMeta(active.id, active.meals_per_week);
      await pgUpdateSubMeta(active.id, { cancel_reason: reason || null, paused_until: null });
      await pgAddTiffinLedger({
        subscriptionId: active.id,
        kind: "adjust",
        label: reason ? `Canceled · ${reason}` : "Canceled",
        amountCents: 0,
      });
    } catch {
      /* ignore */
    }
    return active;
  }

  async getSubscriptionOsFields(sub: { id: string; meals_per_week: number; status: string; cook_id: string }) {
    let meta = {
      flex_quota: defaultFlexQuota(sub.meals_per_week),
      flex_remaining: defaultFlexQuota(sub.meals_per_week),
      paused_until: null as string | null,
      expires_on: null as string | null,
      cancel_reason: null as string | null,
      deliveries_left: sub.meals_per_week * 4 as number | null,
      balance_cents: 0,
      cooking_notes: null as string | null,
      collection_notes: null as string | null,
    };
    try {
      const m = await pgEnsureSubMeta(sub.id, sub.meals_per_week);
      meta = {
        flex_quota: m.flex_quota,
        flex_remaining: m.flex_remaining,
        paused_until: m.paused_until,
        expires_on: m.expires_on,
        cancel_reason: m.cancel_reason,
        deliveries_left: m.deliveries_left,
        balance_cents: m.balance_cents ?? 0,
        cooking_notes: m.cooking_notes ?? null,
        collection_notes: m.collection_notes ?? null,
      };
      // Clear stale pause window so gates + UI stay consistent
      if (meta.paused_until && !isPauseWindowActive(meta.paused_until)) {
        await pgUpdateSubMeta(sub.id, { paused_until: null });
        meta.paused_until = null;
      }
    } catch {
      /* defaults */
    }
    const status = effectiveSubscriptionStatus({
      dbStatus: sub.status,
      pausedUntil: meta.paused_until,
    });
    const deliveries =
      meta.deliveries_left != null
        ? Math.max(0, meta.deliveries_left)
        : Math.max(0, (meta.flex_quota || 0) + 8);
    return {
      ...meta,
      status,
      deliveries_left: deliveries,
      balance_cents: meta.balance_cents ?? 0,
    };
  }

  async listLedger(customerId: string, limit = 40) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) return { subscription_id: null, entries: [] as any[] };
    try {
      const entries = await pgListTiffinLedger(active.id, limit);
      return { subscription_id: active.id, entries };
    } catch {
      return { subscription_id: active.id, entries: [] as any[] };
    }
  }

  async pauseSubscription(customerId: string, pauseDays: number) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) throw createSHCError("SHC-GENERIC-001", "No active tiffin subscription.");
    const meta = await pgEnsureSubMeta(active.id, active.meals_per_week);
    // Same status model as UI: expired paused_until → active
    if (meta.paused_until && !isPauseWindowActive(meta.paused_until)) {
      await pgUpdateSubMeta(active.id, { paused_until: null });
      meta.paused_until = null;
    }
    const osStatus = effectiveSubscriptionStatus({
      dbStatus: active.status,
      pausedUntil: meta.paused_until,
    });
    const gate = canPauseSubscription({
      status: osStatus,
      flexRemaining: meta.flex_remaining,
      pauseDays,
    });
    if (!gate.ok) throw createSHCError("SHC-GENERIC-001", gate.message);
    const applied = applyPause({
      flexRemaining: meta.flex_remaining,
      pauseDays,
      expiresOn: meta.expires_on,
    });
    await pgUpdateSubMeta(active.id, {
      flex_remaining: applied.flexRemaining,
      paused_until: applied.pausedUntil,
      expires_on: applied.expiresOn,
    });
    try {
      await pgAddTiffinLedger({
        subscriptionId: active.id,
        kind: "pause",
        label: `Paused ${pauseDays} day${pauseDays > 1 ? "s" : ""} · flex used`,
        amountCents: 0,
        deltaFlex: -pauseDays,
      });
    } catch {
      /* non-fatal */
    }
    return { ...active, ...applied, status: "paused" };
  }

  async resumeSubscription(customerId: string) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) throw createSHCError("SHC-GENERIC-001", "No active tiffin subscription.");
    const meta = await pgEnsureSubMeta(active.id, active.meals_per_week);
    const osStatus = effectiveSubscriptionStatus({
      dbStatus: active.status,
      pausedUntil: meta.paused_until,
    });
    const gate = canResumeSubscription(osStatus);
    if (!gate.ok) throw createSHCError("SHC-GENERIC-001", gate.message);
    await pgUpdateSubMeta(active.id, { paused_until: null });
    return { ...active, status: "active", paused_until: null };
  }

  /** HomelyEats recharge — extend expiry, reset flex, add meal deliveries + ledger. */
  async rechargeSubscription(
    customerId: string,
    weeks: number,
    opts?: { paynowRef?: string | null }
  ) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) throw createSHCError("SHC-GENERIC-001", "No active tiffin subscription.");
    const meta = await pgEnsureSubMeta(active.id, active.meals_per_week);
    const osStatus = effectiveSubscriptionStatus({
      dbStatus: active.status,
      pausedUntil: meta.paused_until,
    });
    const gate = canRechargeSubscription({ status: osStatus, weeks });
    if (!gate.ok) throw createSHCError("SHC-GENERIC-001", gate.message);
    const os = await this.getSubscriptionOsFields(active);
    const applied = applyRecharge({
      mealsPerWeek: active.meals_per_week,
      weeks,
      flexQuota: meta.flex_quota,
      flexRemaining: meta.flex_remaining,
      deliveriesLeft: os.deliveries_left ?? 0,
      expiresOn: meta.expires_on,
    });
    const amountCents = tiffinRechargeAmountCents(active.meals_per_week, weeks);
    const paynowRef = opts?.paynowRef || `TIFFIN-${active.id.slice(-8)}-${Date.now().toString(36).toUpperCase()}`;
    const nextBalance = Math.max(0, (meta.balance_cents || 0) + amountCents);
    await pgUpdateSubMeta(active.id, {
      flex_quota: applied.flexQuota,
      flex_remaining: applied.flexRemaining,
      expires_on: applied.expiresOn,
      deliveries_left: applied.deliveriesLeft,
      balance_cents: nextBalance,
      paused_until: null,
    });
    try {
      await pgAddTiffinLedger({
        subscriptionId: active.id,
        kind: "recharge",
        label: `PayNow recharge · ${weeks} week${weeks > 1 ? "s" : ""} · +${applied.mealsAdded} meals`,
        amountCents,
        deltaDeliveries: applied.mealsAdded,
        deltaFlex: applied.flexRemaining - (meta.flex_remaining || 0),
        paynowRef,
      });
    } catch {
      /* ledger non-fatal */
    }
    // Ensure sub is active (un-expire path)
    if (active.status === "expired" || active.status === "paused") {
      try {
        await this.updateTiffinSubscriptions({
          selector: { id: active.id },
          data: { status: "active", updated_at: new Date() } as any,
        });
      } catch {
        /* ignore */
      }
    }
    return {
      ...active,
      status: "active",
      flex_quota: applied.flexQuota,
      flex_remaining: applied.flexRemaining,
      expires_on: applied.expiresOn,
      deliveries_left: applied.deliveriesLeft,
      balance_cents: nextBalance,
      meals_added: applied.mealsAdded,
      amount_cents: amountCents,
      paynow_ref: paynowRef,
      weeks,
    };
  }

  async skipMeal(customerId: string, collectionDate: string, collectionSlot?: string, cutoffHours?: number) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) throw createSHCError("SHC-GENERIC-001", "No active tiffin subscription.");
    const meta = await pgEnsureSubMeta(active.id, active.meals_per_week);
    const skips = await pgListSkips(active.id);
    const gate = canSkipTiffinMeal({
      flexRemaining: meta.flex_remaining,
      collectionDate,
      collectionSlot,
      alreadySkipped: skips.includes(collectionDate),
      cutoffHours,
    });
    if (!gate.ok) throw createSHCError("SHC-GENERIC-001", gate.message);
    await pgAddSkip(active.id, collectionDate);
    await pgUpdateSubMeta(active.id, {
      flex_remaining: Math.max(0, meta.flex_remaining - 1),
      expires_on: meta.expires_on ? applyPause({ flexRemaining: 1, pauseDays: 1, expiresOn: meta.expires_on }).expiresOn : meta.expires_on,
    });
    try {
      await pgAddTiffinLedger({
        subscriptionId: active.id,
        kind: "flex",
        label: `Skipped meal · ${collectionDate}`,
        amountCents: 0,
        deltaFlex: -1,
      });
    } catch {
      /* non-fatal */
    }
    return { ok: true, collection_date: collectionDate };
  }

  async listMealInstances(customerId: string, fromIso: string, toIso: string) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) return { subscription: null, meals: [] as any[] };
    const plans = await this.listPlans(active.id);
    const config = await this.getKitchenConfig(active.cook_id);
    let skipped = new Set<string>();
    let kitchenCanceled = new Set<string>();
    let customs = new Map<string, string[]>();
    try {
      skipped = new Set(await pgListSkips(active.id));
      kitchenCanceled = new Set(await pgListKitchenCancels(active.cook_id));
      const customRows = await pgListMealCustoms(active.id, fromIso, toIso);
      for (const c of customRows) {
        customs.set(c.collection_date, c.extra_lines || []);
      }
    } catch {
      /* empty */
    }
    const meals = projectMealInstances({
      subscriptionId: active.id,
      cookId: active.cook_id,
      fromIso,
      toIso,
      plans,
      defaultSlot: config?.default_collection_slot,
      skippedDates: skipped,
      kitchenCanceledDates: kitchenCanceled,
    });
    // Join cook day menu + customer customize extras (HomelyEats card truth)
    const enriched = [];
    for (const m of meals) {
      let published: { product_ids: string[]; note: string | null } | null = null;
      try {
        published = await pgGetDayMenu(active.cook_id, m.collection_date);
      } catch {
        published = null;
      }
      const publishedIds = published?.product_ids || [];
      // HomelyEats: "Menu yet to be updated" until cook publishes day menu
      const menu_pending = publishedIds.length === 0;
      const publishedLines = publishedIds.map((pid) =>
        pid.startsWith("dish_") ? pid.replace(/^dish_/, "").replace(/_/g, " ") : `Dish · ${pid}`
      );
      const extra_lines = customs.get(m.collection_date) || [];
      const menu_lines = menu_pending ? [...extra_lines] : [...publishedLines, ...extra_lines];
      enriched.push({
        ...m,
        menu_lines,
        extra_lines,
        menu_pending,
        menu_note: published?.note || null,
        product_ids: publishedIds.length ? publishedIds : m.product_id ? [m.product_id] : [],
      });
    }
    return { subscription: active, meals: enriched };
  }

  /** HomelyEats customize / add extras (≥8h cutoff). Persists lines + optional wallet debit. */
  async customizeMeal(
    customerId: string,
    collectionDate: string,
    input: {
      extra_lines: string[];
      amount_cents?: number;
      paynow_ref?: string | null;
      collection_slot?: string;
      cutoff_hours?: number;
    }
  ) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) {
      throw Object.assign(new Error("No active subscription"), createSHCError("SHC-GENERIC-001", "No active subscription"));
    }
    const skips = await pgListSkips(active.id).catch(() => [] as string[]);
    if (skips.includes(collectionDate)) {
      throw Object.assign(
        new Error("Cannot customize a skipped meal"),
        createSHCError("SHC-GENERIC-001", "Cannot customize a skipped meal")
      );
    }
    const gate = canCustomizeTiffinMeal({
      collectionDate,
      collectionSlot: input.collection_slot,
      cutoffHours: input.cutoff_hours,
    });
    if (!gate.ok) {
      throw Object.assign(new Error(gate.message), createSHCError("SHC-GENERIC-001", gate.message));
    }
    const amount = Math.max(0, Math.floor(Number(input.amount_cents) || 0));
    const lines = (input.extra_lines || []).map((l) => String(l).trim()).filter(Boolean);
    // Absolute amount upsert — wallet only moves by delta vs prior customize on same date
    const prior = await pgGetMealCustom(active.id, collectionDate).catch(() => null);
    const priorAmount = prior?.amount_cents ?? 0;
    const walletDelta = customizeWalletAdjustCents(amount, priorAmount);
    const saved = await pgUpsertMealCustom({
      subscriptionId: active.id,
      collectionDate,
      extraLines: lines,
      amountCents: amount,
      paynowRef: input.paynow_ref || null,
    });
    if (walletDelta !== 0) {
      try {
        const meta = await pgEnsureSubMeta(active.id, active.meals_per_week);
        // walletDelta > 0 → debit; < 0 → credit refund
        const nextBal = Math.max(0, (meta.balance_cents || 0) - walletDelta);
        await pgUpdateSubMeta(active.id, { balance_cents: nextBal });
        await pgAddTiffinLedger({
          subscriptionId: active.id,
          kind: "customize",
          label:
            walletDelta > 0
              ? `Extras · ${collectionDate}`
              : `Extras adjust · ${collectionDate}`,
          amountCents: -walletDelta,
          paynowRef: input.paynow_ref || null,
        });
      } catch {
        /* non-fatal wallet */
      }
    }
    return {
      ok: true,
      ...saved,
      collection_date: collectionDate,
      wallet_delta_cents: walletDelta,
      prior_amount_cents: priorAmount,
    };
  }

  async updateSubscriptionNotes(
    customerId: string,
    notes: { cooking_notes?: string | null; collection_notes?: string | null }
  ) {
    const active = await this.getActiveSubscription(customerId);
    if (!active) {
      throw Object.assign(new Error("No active subscription"), createSHCError("SHC-GENERIC-001", "No active subscription"));
    }
    await pgEnsureSubMeta(active.id, active.meals_per_week);
    const patch: any = {};
    if (notes.cooking_notes !== undefined) patch.cooking_notes = notes.cooking_notes;
    if (notes.collection_notes !== undefined) patch.collection_notes = notes.collection_notes;
    return pgUpdateSubMeta(active.id, patch);
  }

  async kitchenCancelDay(cookId: string, collectionDate: string, reason?: string) {
    await pgAddKitchenCancel(cookId, collectionDate, reason);
    return { ok: true, collection_date: collectionDate };
  }

  async publishDayMenu(cookId: string, collectionDate: string, productIds: string[], note?: string) {
    await pgUpsertDayMenu(cookId, collectionDate, productIds, note);
    return { ok: true, collection_date: collectionDate, product_ids: productIds };
  }

  async getDayMenu(cookId: string, collectionDate: string) {
    return pgGetDayMenu(cookId, collectionDate);
  }

  async subscriberCount(cookId: string) {
    try {
      return await pgCountActiveSubscribers(cookId);
    } catch {
      return 0;
    }
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