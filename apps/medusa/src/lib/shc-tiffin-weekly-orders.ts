import {
  weekStartMonday,
  collectionDateForWeek,
  resolvePlanForWeek,
  type TiffinPlanSlot,
} from "@shc/business-rules";
import { productTitleFromId } from "./shc-product-titles";

export type TiffinWeeklyOrdersDb = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export type TiffinWeeklyOrdersResult = {
  week_start: string;
  created: number;
  skipped: number;
  order_ids: string[];
};

export function tiffinOrderId(subId: string, weekStart: string, dayOfWeek: number): string {
  return `TIFFIN-${subId.slice(-8)}-${weekStart}-${dayOfWeek}`;
}

export async function materializeTiffinWeeklyOrders(
  db: TiffinWeeklyOrdersDb,
  weekOverride?: string
): Promise<TiffinWeeklyOrdersResult> {
  const weekStart = weekOverride || weekStartMonday();
  const { rows: subs } = await db.query(`SELECT * FROM shc_tiffin_subscription WHERE status = 'active'`);

  let created = 0;
  let skipped = 0;
  const order_ids: string[] = [];

  for (const sub of subs) {
    const { rows: plans } = await db.query(
      `SELECT * FROM shc_tiffin_weekly_plan WHERE subscription_id = $1`,
      [sub.id]
    );
    const slots = resolvePlanForWeek(
      plans.map((p: any) => ({ week_start: p.week_start, slots: (p.slots || []) as TiffinPlanSlot[] })),
      weekStart
    );
    if (!slots.length) {
      skipped++;
      continue;
    }

    const { rows: configRows } = await db.query(
      `SELECT * FROM shc_tiffin_kitchen_config WHERE cook_id = $1 LIMIT 1`,
      [sub.cook_id]
    );
    const config = configRows[0];
    const defaultSlot = config?.default_collection_slot || "18:00-19:00";

    for (const slot of slots) {
      const collectionDate = collectionDateForWeek(weekStart, slot.day_of_week);
      const orderId = tiffinOrderId(sub.id, weekStart, slot.day_of_week);

      const { rows: existing } = await db.query(
        `SELECT order_id FROM shc_order_meta WHERE order_id = $1 LIMIT 1`,
        [orderId]
      );
      if (existing.length) {
        skipped++;
        continue;
      }

      const { rows: products } = await db.query(
        `SELECT product_id, name, price_cents, cook_id FROM shc_product_meta WHERE product_id = $1 LIMIT 1`,
        [slot.product_id]
      );
      const product = products[0];
      if (!product) continue;

      const price = product.price_cents || 1200;
      const items = [
        {
          product_id: slot.product_id,
          name: product.name || productTitleFromId(slot.product_id),
          qty: 1,
          price: price / 100,
          cook_id: sub.cook_id,
        },
      ];

      await db.query(
        `INSERT INTO shc_order_meta (
          id, order_id, cook_id, customer_id, collection_date, collection_slot,
          shc_status, items, total_cents, corporate_note, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'paid', $7::jsonb, $8, $9, now(), now()
        ) ON CONFLICT (order_id) DO NOTHING`,
        [
          `meta_${orderId}`,
          orderId,
          sub.cook_id,
          sub.customer_id,
          collectionDate,
          slot.collection_slot || defaultSlot,
          JSON.stringify(items),
          price,
          `tiffin:${sub.id}:${weekStart}`,
        ]
      );
      created++;
      order_ids.push(orderId);
    }
  }

  return { week_start: weekStart, created, skipped, order_ids };
}