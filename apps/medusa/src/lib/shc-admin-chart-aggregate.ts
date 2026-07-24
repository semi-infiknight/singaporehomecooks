/**
 * Server-side aggregation for SHC Ops visual dashboards.
 * Pure functions + async collector used by GET /admin/shc/charts.
 */

export type ChartSlice = { name: string; value: number };

export function countBy<T>(
  items: T[],
  keyFn: (item: T) => string,
  labelFn?: (key: string) => string
): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ name: labelFn ? labelFn(key) : key, value }))
    .sort((a, b) => b.value - a.value);
}

export function sumBy<T>(
  items: T[],
  keyFn: (item: T) => string,
  valueFn: (item: T) => number
): ChartSlice[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "unknown";
    map.set(key, (map.get(key) || 0) + valueFn(item));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function topN(slices: ChartSlice[], n = 8): ChartSlice[] {
  if (slices.length <= n) return slices;
  const head = slices.slice(0, n);
  const rest = slices.slice(n).reduce((s, x) => s + x.value, 0);
  if (rest > 0) head.push({ name: "Other", value: rest });
  return head;
}

export function priceBucket(priceCents: number | null | undefined): string {
  const p = priceCents != null ? priceCents / 100 : 0;
  if (p <= 0) return "No price";
  if (p < 10) return "Under S$10";
  if (p < 15) return "S$10–14";
  if (p < 20) return "S$15–19";
  if (p < 30) return "S$20–29";
  return "S$30+";
}

export function shortCookLabel(cookId: string | null | undefined): string {
  if (!cookId) return "Unknown cook";
  return cookId.length > 14 ? `${cookId.slice(0, 10)}…` : cookId;
}
