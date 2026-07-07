import ShcCookModuleService from "../modules/shc-cook/service";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import ShcPlatformStatModuleService from "../modules/shc-platform-stat/service";

export type PlatformCounters = {
  cooks: number;
  meals_this_month: number;
  areas: number;
};

/** Launch copy defaults when DB has no activity yet (content/how-it-works.md). */
export const LAUNCH_PLATFORM_COUNTERS: PlatformCounters = {
  cooks: 127,
  meals_this_month: 4892,
  areas: 28,
};

type CounterDeps = {
  cookService: ShcCookModuleService;
  orderMetaService: ShcOrderMetaModuleService;
  statService: ShcPlatformStatModuleService;
};

function currentMonthPrefix() {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

function parseCounterValue(raw: unknown): PlatformCounters | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const cooks = Number(v.cooks);
  const meals = Number(v.meals_this_month ?? v.meals);
  const areas = Number(v.areas);
  if (!Number.isFinite(cooks) || !Number.isFinite(meals) || !Number.isFinite(areas)) return null;
  return {
    cooks: Math.max(0, Math.floor(cooks)),
    meals_this_month: Math.max(0, Math.floor(meals)),
    areas: Math.max(0, Math.floor(areas)),
  };
}

async function readSeededCounters(statService: ShcPlatformStatModuleService): Promise<PlatformCounters | null> {
  const [stats] = await statService.listAndCountPlatformStats({ key: "homepage_counters" }, { take: 1 }).catch(() => [[]]);
  const row = (stats as any[])?.[0];
  return parseCounterValue(row?.value);
}

export async function resolvePlatformCounters(deps: CounterDeps): Promise<{ counters: PlatformCounters; source: "live" | "seed" }> {
  const { cookService, orderMetaService, statService } = deps;
  const monthPrefix = currentMonthPrefix();

  const [cooks, cookCount] = await cookService.listAndCountCooks({ status: "active" }, { take: 500 }).catch(() => [[], 0]);
  const areas = new Set(
    (cooks as any[])
      .map((c) => String(c.area || "").trim())
      .filter(Boolean)
  );

  const [orders] = await orderMetaService.listAndCountOrderMetas({}, { take: 5000 }).catch(() => [[]]);
  const mealsThisMonth = (orders as any[]).filter((o) => {
    const status = String(o.shc_status || "");
    if (status !== "completed" && status !== "collected") return false;
    const date = String(o.collection_date || "");
    return date.startsWith(monthPrefix);
  }).length;

  const live: PlatformCounters = {
    cooks: Number(cookCount) || (cooks as any[]).length,
    meals_this_month: mealsThisMonth,
    areas: areas.size,
  };

  if (live.cooks > 0) {
    return { counters: live, source: "live" };
  }

  const seeded = (await readSeededCounters(statService)) || LAUNCH_PLATFORM_COUNTERS;
  return { counters: seeded, source: "seed" };
}
