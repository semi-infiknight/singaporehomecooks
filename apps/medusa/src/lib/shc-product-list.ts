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

function matchesQuery(meta: any, ql: string): boolean {
  const title = productTitleFromId(meta.product_id).toLowerCase();
  return (
    title.includes(ql) ||
    meta.product_id?.toLowerCase().includes(ql) ||
    meta.cuisine?.toLowerCase().includes(ql) ||
    meta.occasion_tags?.some((t: string) => t.toLowerCase().includes(ql)) ||
    meta.ingredients?.some((i: { name?: string }) => i.name?.toLowerCase().includes(ql))
  );
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
    const ql = search.toLowerCase();
    filtered = filtered.filter((m) => matchesQuery(m, ql));
  }

  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);
  const products = await Promise.all(page.map((meta) => shapeProduct(meta, scope)));

  return { products, count: products.length, total };
}