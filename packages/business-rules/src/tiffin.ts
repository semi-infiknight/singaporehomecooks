/** Tiffin subscription rules — one kitchen, plan slots, flex/skip/pause cutoffs (HomelyEats-aligned). */

export type TiffinPlanSlot = {
  day_of_week: number;
  product_id: string;
  collection_slot?: string;
};

export type TiffinSubscriptionStatus = "active" | "paused" | "expired" | "canceled" | "cancelled";

export type TiffinMealInstanceStatus =
  | "indeterminate"
  | "scheduled"
  | "delivered"
  | "skipped"
  | "canceled_by_kitchen";

/** HomelyEats: customize/skip only if ≥ 8h before collection slot. */
export const TIFFIN_CUSTOMIZE_CUTOFF_HOURS = 8;

/** Flex days per period: max(2, meals_per_week - 1). */
export function defaultFlexQuota(mealsPerWeek: number): number {
  const n = Number.isFinite(mealsPerWeek) ? Math.floor(mealsPerWeek) : 3;
  return Math.max(2, n - 1);
}

export function weekStartMonday(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function collectionDateForWeek(weekStart: string, dayOfWeek: number): string {
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDaysIso(weekStart, mondayOffset);
}

/**
 * Parse collection slot like "18:00-19:00" into a UTC Date on collectionDate (SG evening ≈ UTC morning next day —
 * for cutoff we treat slot start as local wall-clock on that ISO date at the start hour UTC for deterministic rules).
 */
export function slotStartUtc(collectionDateIso: string, collectionSlot = "18:00-19:00"): Date {
  const startPart = (collectionSlot || "18:00-19:00").split("-")[0]?.trim() || "18:00";
  const [hh, mm] = startPart.split(":").map((x) => parseInt(x, 10));
  const h = Number.isFinite(hh) ? hh : 18;
  const m = Number.isFinite(mm) ? mm : 0;
  return new Date(`${collectionDateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
}

/** True if now is at least `hours` before slot start (HomelyEats 8h rule). */
export function canMutateTiffinOrder(
  slotStart: Date,
  now = new Date(),
  hours = TIFFIN_CUSTOMIZE_CUTOFF_HOURS
): boolean {
  return now.getTime() <= slotStart.getTime() - hours * 3600_000;
}

export function canSkipTiffinMeal(input: {
  flexRemaining: number;
  collectionDate: string;
  collectionSlot?: string;
  now?: Date;
  alreadySkipped?: boolean;
  status?: TiffinMealInstanceStatus;
}): { ok: true } | { ok: false; message: string } {
  if (input.alreadySkipped || input.status === "skipped") {
    return { ok: false, message: "This meal is already skipped." };
  }
  if (input.status === "delivered" || input.status === "canceled_by_kitchen") {
    return { ok: false, message: "This meal can no longer be skipped." };
  }
  if (input.flexRemaining <= 0) {
    return { ok: false, message: "No flex days left this period. Recharge or wait for the next period." };
  }
  const start = slotStartUtc(input.collectionDate, input.collectionSlot);
  if (!canMutateTiffinOrder(start, input.now ?? new Date())) {
    return {
      ok: false,
      message: `Skips need at least ${TIFFIN_CUSTOMIZE_CUTOFF_HOURS} hours before collection.`,
    };
  }
  return { ok: true };
}

export function canCustomizeTiffinMeal(input: {
  collectionDate: string;
  collectionSlot?: string;
  now?: Date;
  status?: TiffinMealInstanceStatus;
}): { ok: true } | { ok: false; message: string } {
  if (input.status === "delivered" || input.status === "skipped" || input.status === "canceled_by_kitchen") {
    return { ok: false, message: "This meal can no longer be customized." };
  }
  const start = slotStartUtc(input.collectionDate, input.collectionSlot);
  if (!canMutateTiffinOrder(start, input.now ?? new Date())) {
    return {
      ok: false,
      message: `Customizations need at least ${TIFFIN_CUSTOMIZE_CUTOFF_HOURS} hours before collection.`,
    };
  }
  return { ok: true };
}

export function canPauseSubscription(input: {
  status: string;
  flexRemaining: number;
  pauseDays: number;
}): { ok: true } | { ok: false; message: string } {
  const st = normalizeSubStatus(input.status);
  if (st !== "active") {
    return { ok: false, message: "Only an active subscription can be paused." };
  }
  if (!Number.isInteger(input.pauseDays) || input.pauseDays < 1) {
    return { ok: false, message: "Pause at least 1 day." };
  }
  if (input.pauseDays > input.flexRemaining) {
    return { ok: false, message: `Not enough flex days (have ${input.flexRemaining}).` };
  }
  return { ok: true };
}

export function applyPause(input: {
  flexRemaining: number;
  pauseDays: number;
  now?: Date;
  expiresOn?: string | null;
}): { flexRemaining: number; pausedUntil: string; expiresOn: string | null } {
  const now = input.now ?? new Date();
  const pausedUntil = addDaysIso(now.toISOString().slice(0, 10), input.pauseDays);
  let expiresOn = input.expiresOn ?? null;
  if (expiresOn) {
    expiresOn = addDaysIso(expiresOn, input.pauseDays);
  }
  return {
    flexRemaining: Math.max(0, input.flexRemaining - input.pauseDays),
    pausedUntil,
    expiresOn,
  };
}

export function canResumeSubscription(status: string): { ok: true } | { ok: false; message: string } {
  if (normalizeSubStatus(status) !== "paused") {
    return { ok: false, message: "Subscription is not paused." };
  }
  return { ok: true };
}

export function normalizeSubStatus(status: string): TiffinSubscriptionStatus {
  if (status === "cancelled") return "canceled";
  if (status === "paused" || status === "expired" || status === "canceled" || status === "active") {
    return status;
  }
  return "active";
}

/**
 * Effective OS status for UI + gates (HomelyEats pause window).
 * Stale paused_until in the past → active (pause window elapsed).
 */
export function effectiveSubscriptionStatus(input: {
  dbStatus: string;
  pausedUntil?: string | null;
  now?: Date;
}): "active" | "paused" | "canceled" | "expired" {
  const st = normalizeSubStatus(input.dbStatus);
  if (st === "canceled") return "canceled";
  if (st === "expired") return "expired";
  const today = (input.now ?? new Date()).toISOString().slice(0, 10);
  // Explicit pause window wins: future/today = paused, past = active (stale window)
  if (input.pausedUntil != null && input.pausedUntil !== "") {
    return input.pausedUntil >= today ? "paused" : "active";
  }
  // No date meta: honour explicit paused status string
  if (st === "paused") return "paused";
  return "active";
}

/** True when pause window is still open (paused_until today or future). */
export function isPauseWindowActive(pausedUntil: string | null | undefined, now = new Date()): boolean {
  if (!pausedUntil) return false;
  return pausedUntil >= now.toISOString().slice(0, 10);
}

export function subscriptionCardKind(input: {
  status: string;
  pausedUntil?: string | null;
  expiresOn?: string | null;
  now?: Date;
}): "active" | "paused" | "expires_soon" | "canceled" | "expired" {
  const st = effectiveSubscriptionStatus({
    dbStatus: input.status,
    pausedUntil: input.pausedUntil,
    now: input.now,
  });
  if (st === "canceled") return "canceled";
  if (st === "expired") return "expired";
  if (st === "paused") return "paused";
  if (input.expiresOn) {
    const now = input.now ?? new Date();
    const exp = new Date(`${input.expiresOn}T12:00:00.000Z`).getTime();
    const days = (exp - now.getTime()) / 86400000;
    if (days <= 3) return "expires_soon";
  }
  return "active";
}

export function assertOneKitchenSubscription(
  existingCookId: string | null | undefined,
  nextCookId: string
): { ok: true } | { ok: false; message: string } {
  if (existingCookId && existingCookId !== nextCookId) {
    return {
      ok: false,
      message: "You already have an active tiffin subscription with another kitchen. Cancel it before switching.",
    };
  }
  return { ok: true };
}

export function validateWeeklyPlanSlots(
  slots: TiffinPlanSlot[],
  mealsPerWeek: number,
  eligibleProductIds: string[],
  allowedDays: number[]
): { ok: true } | { ok: false; message: string } {
  if (!Number.isInteger(mealsPerWeek) || mealsPerWeek < 2 || mealsPerWeek > 4) {
    return { ok: false, message: "Meals per week must be 2, 3, or 4." };
  }
  if (slots.length !== mealsPerWeek) {
    return { ok: false, message: `Pick exactly ${mealsPerWeek} meals for your weekly plan.` };
  }
  const days = new Set<number>();
  for (const slot of slots) {
    if (slot.day_of_week < 0 || slot.day_of_week > 6) {
      return { ok: false, message: "Invalid collection day." };
    }
    if (allowedDays.length && !allowedDays.includes(slot.day_of_week)) {
      return { ok: false, message: "Selected day is not offered by this kitchen." };
    }
    if (days.has(slot.day_of_week)) {
      return { ok: false, message: "Only one meal per day in your weekly plan." };
    }
    days.add(slot.day_of_week);
    if (!eligibleProductIds.includes(slot.product_id)) {
      return { ok: false, message: "A selected dish is not available for tiffin at this kitchen." };
    }
  }
  return { ok: true };
}

/** Resolve plan for a week: override row wins, else recurring template. */
export function resolvePlanForWeek<T extends { week_start: string | null; slots: TiffinPlanSlot[] }>(
  plans: T[],
  weekStart: string
): TiffinPlanSlot[] {
  const override = plans.find((p) => p.week_start === weekStart);
  if (override) return override.slots;
  const template = plans.find((p) => p.week_start === null);
  return template?.slots ?? [];
}

/**
 * Project meal instances for a date range from plan slots (HomelyEats calendar).
 * Status defaults to scheduled/indeterminate by proximity; callers merge skip/order facts.
 */
export function projectMealInstances(input: {
  subscriptionId: string;
  cookId: string;
  fromIso: string;
  toIso: string;
  plans: { week_start: string | null; slots: TiffinPlanSlot[] }[];
  defaultSlot?: string;
  now?: Date;
  skippedDates?: Set<string>;
  kitchenCanceledDates?: Set<string>;
  deliveredDates?: Set<string>;
}): Array<{
  id: string;
  subscription_id: string;
  cook_id: string;
  collection_date: string;
  day_of_week: number;
  product_id: string;
  collection_slot: string;
  status: TiffinMealInstanceStatus;
  customizable: boolean;
}> {
  const out: Array<{
    id: string;
    subscription_id: string;
    cook_id: string;
    collection_date: string;
    day_of_week: number;
    product_id: string;
    collection_slot: string;
    status: TiffinMealInstanceStatus;
    customizable: boolean;
  }> = [];
  const now = input.now ?? new Date();
  let cursor = input.fromIso;
  while (cursor <= input.toIso) {
    const weekStart = weekStartMonday(new Date(`${cursor}T12:00:00.000Z`));
    const slots = resolvePlanForWeek(input.plans, weekStart);
    for (const slot of slots) {
      const collectionDate = collectionDateForWeek(weekStart, slot.day_of_week);
      if (collectionDate < input.fromIso || collectionDate > input.toIso) continue;
      const collection_slot = slot.collection_slot || input.defaultSlot || "18:00-19:00";
      let status: TiffinMealInstanceStatus = "scheduled";
      if (input.skippedDates?.has(collectionDate)) status = "skipped";
      else if (input.kitchenCanceledDates?.has(collectionDate)) status = "canceled_by_kitchen";
      else if (input.deliveredDates?.has(collectionDate)) status = "delivered";
      else {
        // HomelyEats: past collection slots without skip/cancel → delivered (completed collection)
        const start = slotStartUtc(collectionDate, collection_slot);
        if (now.getTime() > start.getTime()) {
          status = "delivered";
        } else {
          const daysAhead =
            (new Date(`${collectionDate}T12:00:00.000Z`).getTime() - now.getTime()) / 86400000;
          if (daysAhead > 14) status = "indeterminate";
        }
      }
      const customizable =
        status === "scheduled" || status === "indeterminate"
          ? canCustomizeTiffinMeal({ collectionDate, collectionSlot: collection_slot, now }).ok
          : false;
      out.push({
        id: `tiffin_meal_${input.subscriptionId}_${collectionDate}`,
        subscription_id: input.subscriptionId,
        cook_id: input.cookId,
        collection_date: collectionDate,
        day_of_week: slot.day_of_week,
        product_id: slot.product_id,
        collection_slot,
        status,
        customizable,
      });
    }
    cursor = addDaysIso(cursor, 1);
  }
  // de-dupe by date
  const byDate = new Map<string, (typeof out)[0]>();
  for (const row of out) byDate.set(row.collection_date, row);
  return [...byDate.values()].sort((a, b) => a.collection_date.localeCompare(b.collection_date));
}
