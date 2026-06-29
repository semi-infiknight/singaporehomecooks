import ShcProductMetaModuleService from "../modules/shc-product-meta/service";
import { listProductMetasFromDb } from "./shc-product-meta-pg";
import { shapeProduct } from "./shc-product-shape";
import { productTitleFromId } from "./shc-product-titles";

export type ShcProductListFilters = {
  cook_id?: string;
  cuisine?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

function textIncludes(value: unknown, query: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(query);
}

function matchesQuery(meta: any, ql: string): boolean {
  const title = (meta.name || productTitleFromId(meta.product_id)).toLowerCase();
  return (
    title.includes(ql) ||
    textIncludes(meta.product_id, ql) ||
    textIncludes(meta.description, ql) ||
    textIncludes(meta.heritage_note, ql) ||
    textIncludes(meta.cuisine, ql) ||
    meta.occasion_tags?.some((t: string) => t.toLowerCase().includes(ql)) ||
    meta.ingredients?.some((i: { name?: string }) => i.name?.toLowerCase().includes(ql))
  );
}

async function expandSearchTerms(scope: any, search: string): Promise<string[]> {
  const ql = search.trim().toLowerCase();
  if (!ql) return [];
  const terms = new Set([ql]);
  try {
    const synonymService = scope.resolve("shcSearchSynonym");
    const [exactRows] = await synonymService.listAndCountSearchSynonyms({ term: ql }, { take: 1 });
    const [allRows] = await synonymService.listAndCountSearchSynonyms({}, { take: 100 });
    const rows = [...(exactRows || []), ...(allRows || [])];
    for (const row of rows) {
      const expansions = Array.isArray(row.expansions) ? row.expansions : [];
      if (row.term?.toLowerCase() === ql) {
        expansions.forEach((term: string) => terms.add(term.toLowerCase()));
      }
      if (expansions.some((term: string) => term.toLowerCase() === ql)) {
        terms.add(String(row.term).toLowerCase());
        expansions.forEach((term: string) => terms.add(term.toLowerCase()));
      }
    }
  } catch {
    /* synonym module is optional for search fallback */
  }
  return [...terms];
}

export async function listShcProducts(scope: any, filters: ShcProductListFilters) {
  const { cook_id, cuisine, q: search, limit = 12, offset = 0 } = filters;
  const metaService: ShcProductMetaModuleService = scope.resolve("shcProductMeta");

  const [allMetas] = await metaService.listAndCountProductMetas({} as any, { take: 200 }).catch(() => [[]]);
  let filtered = (allMetas as any[]) || [];
  if (!filtered.length) {
    filtered = await listProductMetasFromDb(200);
  }
  if (cook_id) filtered = filtered.filter((m) => m.cook_id === cook_id);
  if (cuisine) filtered = filtered.filter((m) => m.cuisine?.toLowerCase().includes(cuisine.toLowerCase()));
  if (search) {
    const terms = await expandSearchTerms(scope, search);
    filtered = filtered.filter((m) => terms.some((term) => matchesQuery(m, term)));
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);
  const products = await Promise.all(page.map((meta) => shapeProduct(meta, scope)));

  return { products, count: products.length, total };
}