export type PlatformCounters = {
  cooks: number;
  meals_this_month: number;
  areas: number;
};

export const LAUNCH_PLATFORM_COUNTERS: PlatformCounters = {
  cooks: 127,
  meals_this_month: 4892,
  areas: 28,
};

export function formatPlatformCounterCopy(counters: PlatformCounters) {
  const cooks = counters.cooks.toLocaleString('en-SG');
  const meals = counters.meals_this_month.toLocaleString('en-SG');
  const areas = counters.areas.toLocaleString('en-SG');
  return {
    cooksLabel: `${cooks}${counters.cooks >= 10 ? '+' : ''} verified cooks`,
    cooksSub: `Across ${areas} areas`,
    mealsLabel: `${meals} meals`,
    mealsSub: 'Served this month',
  };
}
