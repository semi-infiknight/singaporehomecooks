/** Shared catalog category presets (admin-managed, not set by cooks). */

export const CATALOG_CATEGORIES_KEY = "catalog_categories";

export type CatalogCategory = {
  id: string;
  label: string;
  imageUrl: string;
  enabled: boolean;
  sort_order: number;
};

export const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "Peranakan",
    label: "Nyonya",
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84a?w=400&q=80&auto=format&fit=crop",
    enabled: true,
    sort_order: 10,
  },
  {
    id: "Malay",
    label: "Malay",
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80&auto=format&fit=crop",
    enabled: true,
    sort_order: 20,
  },
  {
    id: "Chinese",
    label: "Chinese",
    imageUrl: "https://images.unsplash.com/photo-1525755662778-989dcdf1cd25?w=400&q=80&auto=format&fit=crop",
    enabled: true,
    sort_order: 30,
  },
  {
    id: "Indian",
    label: "Indian",
    imageUrl: "https://images.unsplash.com/photo-1589302168064-964664aafa85?w=400&q=80&auto=format&fit=crop",
    enabled: true,
    sort_order: 40,
  },
  {
    id: "Eurasian",
    label: "Eurasian",
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80&auto=format&fit=crop",
    enabled: true,
    sort_order: 50,
  },
];

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
