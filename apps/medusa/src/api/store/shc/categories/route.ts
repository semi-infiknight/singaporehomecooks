import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MIND_CUISINE_CATEGORIES } from "@shc/utils";
import {
  CATALOG_CATEGORIES_KEY,
  DEFAULT_CATALOG_CATEGORIES,
  type CatalogCategory,
} from "../../../../lib/shc-catalog-categories";

function mindCategoryRow(categories: CatalogCategory[]) {
  const byId = new Map(MIND_CUISINE_CATEGORIES.map((c) => [c.id, c]));
  const all = byId.get("")!;
  return [
    { id: all.id, label: all.label, imageUrl: all.imageUrl },
    ...categories.map((c) => {
      const preset = byId.get(c.id);
      return {
        id: c.id,
        label: c.label || preset?.label || c.id,
        imageUrl: preset?.imageUrl || c.imageUrl || all.imageUrl,
      };
    }),
  ];
}

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
    const mind = mindCategoryRow(categories);
    res.json({ categories: mind, count: mind.length });
  } catch {
    res.json({
      categories: MIND_CUISINE_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        imageUrl: c.imageUrl,
      })),
      count: MIND_CUISINE_CATEGORIES.length,
      source: "default",
    });
  }
}
