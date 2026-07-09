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
import { materializeTiffinWeeklyOrders } from "../src/lib/shc-tiffin-weekly-orders";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const weekArg = process.argv.find((a) => a.startsWith("--week="))?.split("=")[1];

  try {
    const result = await materializeTiffinWeeklyOrders(
      {
        query: (sql, params) =>
          client.query(sql, params).then((r: { rows: unknown[] }) => ({ rows: r.rows })),
      },
      weekArg
    );
    console.log(`[TIFFIN-ORDERS] week_start=${result.week_start} created=${result.created} skipped=${result.skipped}`);
    for (const id of result.order_ids) {
      console.log(`  ✓ order ${id}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[TIFFIN-ORDERS] failed:", e.message);
  process.exit(1);
});