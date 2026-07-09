#!/usr/bin/env tsx
/**
 * Generate tiffin subscription orders for the current week.
 * Idempotent via deterministic order_id prefix TIFFIN-{subId}-{week}-{day}.
 *
 * Run: cd apps/medusa && pnpm exec tsx scripts/tiffin-weekly-orders.ts
 */
import "dotenv/config";
// @ts-ignore workspace
import { Client } from "pg";
// @ts-ignore workspace
import { weekStartMonday, collectionDateForWeek, resolvePlanForWeek } from "@shc/business-rules";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";

async function runTiffinWeeklyOrders(weekOverride?: string) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const weekStart = weekOverride || weekStartMonday();
  console.log(`[TIFFIN-ORDERS] week_start=${weekStart}`);

  try {
    const { rows: subs } = await client.query(
      `SELECT * FROM shc_tiffin_subscription WHERE status = 'active'`
    );

    let created = 0;
    let skipped = 0;

    for (const sub of subs) {
      const { rows: plans } = await client.query(
        `SELECT * FROM shc_tiffin_weekly_plan WHERE subscription_id = $1`,
        [sub.id]
      );
      const slots = resolvePlanForWeek(
        plans.map((p: any) => ({ week_start: p.week_start, slots: p.slots || [] })),
        weekStart
      );
      if (!slots.length) {
        console.log(`  skip sub=${sub.id} (no plan slots)`);
        skipped++;
        continue;
      }

      const { rows: configRows } = await client.query(
        `SELECT * FROM shc_tiffin_kitchen_config WHERE cook_id = $1 LIMIT 1`,
        [sub.cook_id]
      );
      const config = configRows[0];
      const defaultSlot = config?.default_collection_slot || "18:00-19:00";

      for (const slot of slots) {
        const collectionDate = collectionDateForWeek(weekStart, slot.day_of_week);
        const orderId = `TIFFIN-${sub.id.slice(-8)}-${weekStart}-${slot.day_of_week}`;

        const { rows: existing } = await client.query(
          `SELECT order_id FROM shc_order_meta WHERE order_id = $1 LIMIT 1`,
          [orderId]
        );
        if (existing.length) {
          skipped++;
          continue;
        }

        const { rows: products } = await client.query(
          `SELECT product_id, title, price_cents, cook_id FROM shc_product_meta WHERE product_id = $1 LIMIT 1`,
          [slot.product_id]
        );
        const product = products[0];
        if (!product) {
          console.log(`  skip slot product missing ${slot.product_id}`);
          continue;
        }

        const price = product.price_cents || 1200;
        const items = [
          {
            product_id: slot.product_id,
            name: product.title,
            qty: 1,
            price: price / 100,
            cook_id: sub.cook_id,
          },
        ];

        await client.query(
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
        console.log(`  ✓ order ${orderId} (${product.title} · ${collectionDate})`);
      }
    }

    console.log(`[TIFFIN-ORDERS] done created=${created} skipped=${skipped}`);
  } finally {
    await client.end();
  }
}

const weekArg = process.argv.find((a) => a.startsWith("--week="))?.split("=")[1];
runTiffinWeeklyOrders(weekArg).catch((e) => {
  console.error("[TIFFIN-ORDERS] failed:", e.message);
  process.exit(1);
});