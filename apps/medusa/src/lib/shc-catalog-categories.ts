/** Shared catalog category presets (admin-managed, not set by cooks). */

import { MIND_CUISINE_CATEGORIES } from "@shc/utils";

export const CATALOG_CATEGORIES_KEY = "catalog_categories";

export type CatalogCategory = {
  id: string;
  label: string;
  imageUrl: string;
  enabled: boolean;
  sort_order: number;
};

export const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = MIND_CUISINE_CATEGORIES.filter(
  (c) => c.id
).map((c, i) => ({
  id: c.id,
  label: c.label,
  imageUrl: c.imageUrl,
  enabled: true,
  sort_order: (i + 1) * 10,
}));

export function normalizeCategories(raw: unknown): CatalogCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_CATALOG_CATEGORIES.map((c) => ({ ...c }));
  }
  return raw
    .map((row: any, i: number) => ({
      id: String(row.id || row.label || `cat_${i}`).trim(),
      label: String(row.label || row.id || "Category").trim(),
      imageUrl: String(row.imageUrl || row.image_url || "").trim(),
      enabled: row.enabled !== false,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : (i + 1) * 10,
    }))
    .filter((c) => c.id)
    .sort((a, b) => a.sort_order - b.sort_order);
}
