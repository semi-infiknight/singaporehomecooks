/** Extract unique dishes from past orders for "Order again" rails (Toptal personalization). */

export type ReorderDish = {
  id: string;
  name: string;
  cook_name?: string;
  price: number;
  cuisine?: string;
  productId?: string;
};

export function extractReorderDishes(orders: Array<Record<string, unknown>>): ReorderDish[] {
  const seen = new Set<string>();
  const out: ReorderDish[] = [];

  for (const order of orders) {
    const status = String(order.shc_status || order.status || '');
    if (!['collected', 'completed', 'paid', 'accepted', 'preparing', 'ready_for_collection'].includes(status)) {
      continue;
    }
    const items = (order.items as Array<Record<string, unknown>>) || [];
    for (const item of items) {
      const id = String(item.product_id || item.productId || item.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        productId: id,
        name: String(item.name || 'Dish'),
        cook_name: String(item.cook_name || order.cook_name || ''),
        price: Number(item.price || 0),
        cuisine: item.cuisine ? String(item.cuisine) : undefined,
      });
    }
  }
  return out.slice(0, 6);
}