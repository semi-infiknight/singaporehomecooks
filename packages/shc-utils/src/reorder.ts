/** Extract unique dishes from past orders for "Order again" rails (Toptal personalization). */

import { sortByCookProximity } from './location';

export type ReorderDish = {
  id: string;
  name: string;
  cook_name?: string;
  cook_id?: string;
  cook_area?: string;
  price: number;
  cuisine?: string;
  productId?: string;
};

export function buildCookAreaById(
  cooks: Array<{ id?: string; area?: string }> = [],
  products: Array<{ cook_id?: string; cook_area?: string }> = []
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cook of cooks) {
    const id = cook.id ? String(cook.id) : '';
    const area = cook.area ? String(cook.area) : '';
    if (id && area) map.set(id, area);
  }
  for (const product of products) {
    const cookId = product.cook_id ? String(product.cook_id) : '';
    const area = product.cook_area ? String(product.cook_area) : '';
    if (cookId && area && !map.has(cookId)) map.set(cookId, area);
  }
  return map;
}

export function extractReorderDishes(
  orders: Array<Record<string, unknown>>,
  cookAreaByCookId?: Map<string, string>
): ReorderDish[] {
  const seen = new Set<string>();
  const out: ReorderDish[] = [];

  for (const order of orders) {
    const status = String(order.shc_status || order.status || '');
    if (!['collected', 'completed', 'paid', 'accepted', 'preparing', 'ready_for_collection'].includes(status)) {
      continue;
    }
    const orderCookId = order.cook_id ? String(order.cook_id) : '';
    const orderCookArea = orderCookId ? cookAreaByCookId?.get(orderCookId) : undefined;
    const items = (order.items as Array<Record<string, unknown>>) || [];
    for (const item of items) {
      const id = String(item.product_id || item.productId || item.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const cookId = String(item.cook_id || orderCookId || '');
      const cookArea = cookId ? cookAreaByCookId?.get(cookId) ?? orderCookArea : orderCookArea;
      out.push({
        id,
        productId: id,
        name: String(item.name || 'Dish'),
        cook_name: String(item.cook_name || order.cook_name || ''),
        cook_id: cookId || undefined,
        cook_area: cookArea,
        price: Number(item.price || 0),
        cuisine: item.cuisine ? String(item.cuisine) : undefined,
      });
    }
  }
  return out.slice(0, 6);
}

/** Prefer nearby kitchens when browse proximity (GPS) is known. */
export function sortReorderDishesByProximity<T extends { cook_area?: string }>(
  dishes: T[],
  customer: { lat: number; lng: number } | null | undefined
): T[] {
  return sortByCookProximity(dishes, customer);
}
