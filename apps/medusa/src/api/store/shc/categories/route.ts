import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  CATALOG_CATEGORIES_KEY,
  DEFAULT_CATALOG_CATEGORIES,
  type CatalogCategory,
} from "../../../../lib/shc-catalog-categories";

/**
 * GET /store/shc/categories — public mind-row categories (admin-managed).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const statService: any = req.scope.resolve("shcPlatformStat");
    const [existing] = await statService.listAndCountPlatformStats({ key: CATALOG_CATEGORIES_KEY }, { take: 1 });
    const raw = existing?.[0]?.value;
    let categories: CatalogCategory[] = DEFAULT_CATALOG_CATEGORIES;
    if (Array.isArray(raw) && raw.length > 0) {
      categories = raw
        .map((row: any, i: number) => ({
          id: String(row.id || "").trim(),
          label: String(row.label || row.id || "").trim(),
          imageUrl: String(row.imageUrl || row.image_url || "").trim(),
          enabled: row.enabled !== false,
          sort_order: Number(row.sort_order) || (i + 1) * 10,
        }))
        .filter((c: CatalogCategory) => c.id && c.enabled)
        .sort((a: CatalogCategory, b: CatalogCategory) => a.sort_order - b.sort_order);
    } else {
      categories = DEFAULT_CATALOG_CATEGORIES.filter((c) => c.enabled);
    }
    const mind = [
      {
        id: "",
        label: "All",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a1e63c?w=400&q=80&auto=format&fit=crop",
      },
      ...categories.map((c) => ({ id: c.id, label: c.label, imageUrl: c.imageUrl })),
    ];
    res.json({ categories: mind, count: mind.length });
  } catch {
    res.json({
      categories: [
        {
          id: "",
          label: "All",
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a1e63c?w=400&q=80&auto=format&fit=crop",
        },
        ...DEFAULT_CATALOG_CATEGORIES.map((c) => ({ id: c.id, label: c.label, imageUrl: c.imageUrl })),
      ],
      count: DEFAULT_CATALOG_CATEGORIES.length + 1,
      source: "default",
    });
  }
}
