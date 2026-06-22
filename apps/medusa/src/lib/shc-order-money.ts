/** Resolve order total + customer for ledger/credits from Medusa order or SHC meta fallback. */
export async function resolveOrderMoney(
  container: any,
  orderId: string,
): Promise<{ totalCents: number; customerId?: string }> {
  let totalCents = 0;
  let customerId: string | undefined;

  try {
    const orderService = container.resolve("order") as any;
    const order = await orderService.retrieveOrder(orderId, { relations: ["items", "customer"] });
    if (order?.items?.length) {
      totalCents = order.items.reduce((sum: number, item: any) => {
        const price = item.unit_price || (item.raw_unit_price && item.raw_unit_price.value) || 0;
        return sum + Number(price) * (item.quantity || 1);
      }, 0);
    } else if (order?.total) {
      totalCents = Math.floor(Number(order.total));
    }
    customerId = order?.customer?.id || order?.customer_id;
  } catch {
    // Demo / meta-only orders have no Medusa order row — fall through to meta.
  }

  if (totalCents <= 0 || !customerId) {
    try {
      const metaService = container.resolve("shcOrderMeta") as any;
      const [metas] = await metaService.listAndCountOrderMetas({ order_id: orderId } as any, { take: 1 }).catch(() => [[]]);
      const meta = (metas as any[])?.[0];
      if (meta) {
        if (totalCents <= 0 && meta.total_cents) totalCents = Number(meta.total_cents);
        if (!customerId && meta.customer_id) customerId = String(meta.customer_id);
      }
    } catch {
      // ignore
    }
  }

  return { totalCents, customerId };
}