import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import {
  CATALOG_CATEGORIES_KEY,
  DEFAULT_CATALOG_CATEGORIES,
  normalizeCategories,
  type CatalogCategory,
} from "../../../../lib/shc-catalog-categories";

async function loadCategories(statService: ShcPlatformStatModuleService): Promise<CatalogCategory[]> {
  const [existing] = await statService.listAndCountPlatformStats({ key: CATALOG_CATEGORIES_KEY }, { take: 1 });
  return normalizeCategories(existing?.[0]?.value);
}

async function saveCategories(statService: ShcPlatformStatModuleService, categories: CatalogCategory[]) {
  const sorted = normalizeCategories(categories);
  const [existing] = await statService.listAndCountPlatformStats({ key: CATALOG_CATEGORIES_KEY }, { take: 1 });
  if (existing?.[0]?.id) {
    await statService.updatePlatformStats({
      selector: { id: existing[0].id },
      data: { value: sorted } as any,
    });
  } else {
    await statService.createPlatformStats([{ key: CATALOG_CATEGORIES_KEY, value: sorted } as any]);
  }
  return sorted;
}

const UpsertSchema = z
  .object({
    id: z.string().min(1).max(64),
    label: z.string().min(1).max(80),
    imageUrl: z.string().optional(),
    enabled: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

const ReplaceSchema = z
  .object({
    categories: z.array(UpsertSchema).min(1).max(40),
  })
  .strict();

/** GET /admin/shc/categories */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const categories = await loadCategories(statService);
    res.json({ categories, count: categories.length, source: "platform_stat" });
  } catch (e: any) {
    res.json({
      categories: DEFAULT_CATALOG_CATEGORIES,
      count: DEFAULT_CATALOG_CATEGORIES.length,
      source: "default",
      note: e.message,
    });
  }
}

/** POST /admin/shc/categories — upsert one or replace all */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body || {};
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    if (Array.isArray((body as any).categories)) {
      const parse = ReplaceSchema.safeParse(body);
      if (!parse.success) {
        return res
          .status(400)
          .json({ error: createSHCError("SHC-GENERIC-001", "Invalid categories payload", parse.error.format() as any) });
      }
      const categories = await saveCategories(
        statService,
        parse.data.categories.map((c, i) => ({
          id: c.id,
          label: c.label,
          imageUrl: c.imageUrl || "",
          enabled: c.enabled !== false,
          sort_order: c.sort_order ?? (i + 1) * 10,
        }))
      );
      return res.json({ categories, count: categories.length, action: "replace" });
    }

    const parse = UpsertSchema.safeParse(body);
    if (!parse.success) {
      return res
        .status(400)
        .json({ error: createSHCError("SHC-GENERIC-001", "Invalid category payload", parse.error.format() as any) });
    }
    const current = await loadCategories(statService);
    const next = [...current];
    const idx = next.findIndex((c) => c.id === parse.data.id);
    const row: CatalogCategory = {
      id: parse.data.id,
      label: parse.data.label,
      imageUrl: parse.data.imageUrl || (idx >= 0 ? next[idx].imageUrl : ""),
      enabled: parse.data.enabled !== false,
      sort_order: parse.data.sort_order ?? (idx >= 0 ? next[idx].sort_order : (next.length + 1) * 10),
    };
    if (idx >= 0) next[idx] = row;
    else next.push(row);
    const categories = await saveCategories(statService, next);
    res.json({ categories, category: row, count: categories.length, action: idx >= 0 ? "update" : "create" });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Category save failed") });
  }
}

/** DELETE /admin/shc/categories?id=Peranakan */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = String((req.query as any)?.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "id query required") });
  }
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  try {
    const current = await loadCategories(statService);
    const next = current.filter((c) => c.id !== id);
    if (next.length === current.length) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Category not found: ${id}`) });
    }
    const categories = await saveCategories(statService, next);
    res.json({ ok: true, categories, count: categories.length });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Delete failed") });
  }
}
