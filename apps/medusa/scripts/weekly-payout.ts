#!/usr/bin/env tsx
/**
 * Weekly PayNow payout batch builder (MVP).
 *
 * Aggregates existing Cook-Earnings-Payable ledger rows for completed orders in the
 * prior Mon–Sun accrual window. Does NOT re-post commission (posted on order complete).
 * Creates shc_payout_batch + per-cook shc_payout_batch_line rows, tags ledger batch_id,
 * and posts a single payout clearing leg for the batch total.
 *
 * Run manually:
 *   cd apps/medusa && pnpm exec tsx scripts/weekly-payout.ts
 *   pnpm exec tsx scripts/weekly-payout.ts --week 2026-06-09
 *
 * Idempotent: skips if batch for week_start already has lines.
 */

import "dotenv/config";
// @ts-ignore - resolved by tsx/pnpm workspace at runtime
import { Client } from "pg";
import { shcPayoutBatchSchema, shcPayoutBatchLineSchema, createSHCError } from "@shc/types";
// @ts-ignore workspace
import { getPreviousWeekStartIso, getWeekBoundsFromStartIso } from "@shc/utils";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";

type CookAggregate = {
  cook_id: string;
  amount_cents: number;
  order_ids: string[];
};

function parseWeekArg(): string | undefined {
  const idx = process.argv.indexOf("--week");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  const positional = process.argv[2];
  if (positional && !positional.startsWith("-")) return positional;
  return undefined;
}

async function runWeeklyPayout(weekStartOverride?: string) {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("[WEEKLY-PAYOUT] Connected to DB");

  const weekStart = weekStartOverride || getPreviousWeekStartIso();
  const { weekStart: weekStartDate, weekEnd: weekEndDate } = getWeekBoundsFromStartIso(weekStart);
  console.log(`[WEEKLY-PAYOUT] Accrual week_start=${weekStart} (${weekStartDate.toISOString()} → ${weekEndDate.toISOString()})`);

  try {
    const batchCheck = await client.query(
      `SELECT id, total_cents, status FROM shc_payout_batch WHERE week_start = $1`,
      [weekStart]
    );
    let batchId: string;
    if (batchCheck.rows.length) {
      batchId = batchCheck.rows[0].id;
      const lineCountRes = await client.query(
        `SELECT COUNT(*)::int AS c FROM shc_payout_batch_line WHERE batch_id = $1`,
        [batchId]
      );
      if ((lineCountRes.rows[0]?.c || 0) > 0) {
        console.log(`[WEEKLY-PAYOUT] Batch ${batchId} already has lines (idempotent skip).`);
        return;
      }
      if (batchCheck.rows[0].status === "paid") {
        console.log("[WEEKLY-PAYOUT] Batch already paid. Skipping.");
        return;
      }
      console.log(`[WEEKLY-PAYOUT] Reusing empty batch ${batchId}`);
    } else {
      const newBatch = {
        id: `batch_${weekStart}_${Date.now()}`,
        week_start: weekStart,
        status: "pending" as const,
        total_cents: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      shcPayoutBatchSchema.parse(newBatch);
      const ins = await client.query(
        `INSERT INTO shc_payout_batch (id, week_start, status, total_cents, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [newBatch.id, newBatch.week_start, newBatch.status, newBatch.total_cents, newBatch.created_at, newBatch.updated_at]
      );
      batchId = ins.rows[0].id;
      console.log(`[WEEKLY-PAYOUT] Created payout batch ${batchId}`);
    }

    const aggRes = await client.query(
      `SELECT om.cook_id,
              le.order_id,
              le.amount_cents
       FROM shc_ledger_entry le
       INNER JOIN shc_order_meta om ON om.order_id = le.order_id
       WHERE le.debit_account = 'Cook-Earnings-Payable'
         AND le.batch_id IS NULL
         AND om.shc_status = 'completed'
         AND om.updated_at >= $1
         AND om.updated_at < $2`,
      [weekStartDate.toISOString(), weekEndDate.toISOString()]
    );

    if (!aggRes.rows.length) {
      console.log("[WEEKLY-PAYOUT] No unbatched cook earnings in accrual window.");
      return;
    }

    const byCook = new Map<string, CookAggregate>();
    for (const row of aggRes.rows) {
      const cookId = String(row.cook_id);
      const orderId = String(row.order_id);
      const amount = Number(row.amount_cents) || 0;
      const current = byCook.get(cookId) || { cook_id: cookId, amount_cents: 0, order_ids: [] };
      current.amount_cents += amount;
      if (!current.order_ids.includes(orderId)) current.order_ids.push(orderId);
      byCook.set(cookId, current);
    }

    let batchTotal = 0;
    const now = new Date().toISOString();

    for (const agg of byCook.values()) {
      if (agg.amount_cents <= 0) continue;
      const line = {
        id: `pline_${batchId}_${agg.cook_id}_${Date.now()}`,
        batch_id: batchId,
        cook_id: agg.cook_id,
        amount_cents: agg.amount_cents,
        order_count: agg.order_ids.length,
        status: "pending",
        created_at: now,
        updated_at: now,
      };
      shcPayoutBatchLineSchema.partial().parse(line);
      await client.query(
        `INSERT INTO shc_payout_batch_line (id, batch_id, cook_id, amount_cents, order_count, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING`,
        [line.id, line.batch_id, line.cook_id, line.amount_cents, line.order_count, line.status, line.created_at, line.updated_at]
      );

      for (const orderId of agg.order_ids) {
        await client.query(
          `UPDATE shc_ledger_entry
           SET batch_id = $1, updated_at = now()
           WHERE order_id = $2
             AND debit_account = 'Cook-Earnings-Payable'
             AND batch_id IS NULL`,
          [batchId, orderId]
        );
      }

      batchTotal += agg.amount_cents;
      console.log(
        `[WEEKLY-PAYOUT] Line cook=${agg.cook_id} orders=${agg.order_ids.length} amount=${agg.amount_cents}`
      );
    }

    await client.query(`UPDATE shc_payout_batch SET total_cents = $1, updated_at = now() WHERE id = $2`, [
      batchTotal,
      batchId,
    ]);

    const payoutCheck = await client.query(
      `SELECT id FROM shc_ledger_entry
       WHERE batch_id = $1
         AND debit_account = 'Cook-Earnings-Payable'
         AND credit_account = 'Payout-Bank-Clearing'
       LIMIT 1`,
      [batchId]
    );
    if (!payoutCheck.rows.length && batchTotal > 0) {
      const payoutLeg = {
        id: `payout_leg_${batchId}`,
        order_id: null,
        debit_account: "Cook-Earnings-Payable",
        credit_account: "Payout-Bank-Clearing",
        amount_cents: batchTotal,
        batch_id: batchId,
        created_at: now,
        updated_at: now,
      };
      await client.query(
        `INSERT INTO shc_ledger_entry (id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          payoutLeg.id,
          payoutLeg.order_id,
          payoutLeg.debit_account,
          payoutLeg.credit_account,
          payoutLeg.amount_cents,
          payoutLeg.batch_id,
          payoutLeg.created_at,
          payoutLeg.updated_at,
        ]
      );
      console.log(`[WEEKLY-PAYOUT] Posted payout clearing leg amount=${batchTotal}`);
    }

    const batchLegs = await client.query(`SELECT amount_cents FROM shc_ledger_entry WHERE batch_id = $1`, [batchId]);
    const sum = batchLegs.rows.reduce((s: number, r: any) => s + Number(r.amount_cents || 0), 0);
    if (sum < 0) {
      throw createSHCError("SHC-LEDGER-001", "Batch double-entry invariant fail", { batchId, sum });
    }

    console.log(
      JSON.stringify({
        event: "weekly_payout.complete",
        week_start: weekStart,
        batch_id: batchId,
        cook_count: byCook.size,
        total_cents: batchTotal,
        status: "pending",
        timestamp: new Date().toISOString(),
      })
    );
    console.log("[WEEKLY-PAYOUT] Done. Ops can approve via /admin/shc/payouts/:id/approve.");
  } catch (err: any) {
    console.error("[WEEKLY-PAYOUT] Failed:", err.message || err);
    if (err.code) console.error("SHC code context:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runWeeklyPayout(parseWeekArg()).catch((e) => {
  console.error(e);
  process.exit(1);
});
