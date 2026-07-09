/** Tiffin subscription rules — one kitchen per customer, plan slot validation. */

export type TiffinPlanSlot = {
  day_of_week: number;
  product_id: string;
  collection_slot?: string;
};

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
  // weekStart is Monday (1); day_of_week 0=Sun..6=Sat
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDaysIso(weekStart, mondayOffset);
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