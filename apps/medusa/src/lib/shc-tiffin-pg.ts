/**
 * Direct Postgres access for tiffin kitchen + subscription OS metadata.
 * MikroORM list was empty on Railway for kitchen config; meta tables use the same pg path.
 */
// @ts-ignore pg resolved at runtime
import { Client } from "pg";
import type { TiffinKitchenConfigDTO } from "../modules/shc-tiffin/service";
import {
  defaultFlexQuota,
  addDaysIso,
  type TiffinPlanSlot,
} from "@shc/business-rules";

async function withPg<T>(fn: (pg: Client) => Promise<T>): Promise<T> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();
  try {
    return await fn(pg);
  } finally {
    await pg.end().catch(() => {});
  }
}

async function ensureMetaTables(pg: Client) {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS shc_tiffin_sub_meta (
      subscription_id text PRIMARY KEY,
      flex_quota integer NOT NULL DEFAULT 2,
      flex_remaining integer NOT NULL DEFAULT 2,
      paused_until text,
      expires_on text,
      cancel_reason text,
      deliveries_left integer,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  // Additive column for HomelyEats recharge balance (safe on existing DBs)
  await pg.query(`
    ALTER TABLE shc_tiffin_sub_meta ADD COLUMN IF NOT EXISTS deliveries_left integer;
  `);
  await pg.query(`
    CREATE TABLE IF NOT EXISTS shc_tiffin_skip (
      id text PRIMARY KEY,
      subscription_id text NOT NULL,
      collection_date text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (subscription_id, collection_date)
    );
  `);
  await pg.query(`
    CREATE TABLE IF NOT EXISTS shc_tiffin_kitchen_cancel (
      id text PRIMARY KEY,
      cook_id text NOT NULL,
      collection_date text NOT NULL,
      reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (cook_id, collection_date)
    );
  `);
  await pg.query(`
    CREATE TABLE IF NOT EXISTS shc_tiffin_day_menu (
      id text PRIMARY KEY,
      cook_id text NOT NULL,
      collection_date text NOT NULL,
      product_ids jsonb NOT NULL DEFAULT '[]',
      note text,
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (cook_id, collection_date)
    );
  `);
  // Wave 5 — customer plan ledger (recharge / flex / meal activity)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS shc_tiffin_ledger (
      id text PRIMARY KEY,
      subscription_id text NOT NULL,
      kind text NOT NULL,
      label text NOT NULL,
      amount_cents integer NOT NULL DEFAULT 0,
      delta_deliveries integer NOT NULL DEFAULT 0,
      delta_flex integer NOT NULL DEFAULT 0,
      paynow_ref text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pg.query(`
    CREATE INDEX IF NOT EXISTS idx_shc_tiffin_ledger_sub
      ON shc_tiffin_ledger (subscription_id, created_at DESC);
  `);
  await pg.query(`
    ALTER TABLE shc_tiffin_sub_meta ADD COLUMN IF NOT EXISTS balance_cents integer DEFAULT 0;
  `);
}

function shapeRow(row: any): TiffinKitchenConfigDTO {
  return {
    cook_id: row.cook_id,
    enabled: !!row.enabled,
    tagline: row.tagline ?? null,
    eligible_product_ids: row.eligible_product_ids || [],
    meals_per_week_options: row.meals_per_week_options || [2, 3, 4],
    collection_days: row.collection_days || [1, 2, 3, 4, 5],
    default_collection_slot: row.default_collection_slot || "18:00-19:00",
  };
}

export async function pgGetKitchenConfig(cookId: string): Promise<TiffinKitchenConfigDTO | null> {
  return withPg(async (pg) => {
    const r = await pg.query(`SELECT * FROM shc_tiffin_kitchen_config WHERE cook_id = $1 LIMIT 1`, [cookId]);
    const row = r.rows[0];
    return row ? shapeRow(row) : null;
  });
}

export async function pgListEnabledKitchens(): Promise<TiffinKitchenConfigDTO[]> {
  return withPg(async (pg) => {
    const r = await pg.query(
      `SELECT * FROM shc_tiffin_kitchen_config WHERE enabled = true ORDER BY cook_id LIMIT 100`
    );
    return r.rows.map(shapeRow);
  });
}

export async function pgUpsertKitchenConfig(
  cookId: string,
  data: Partial<TiffinKitchenConfigDTO>
): Promise<TiffinKitchenConfigDTO> {
  return withPg(async (pg) => {
    const existing = await pg.query(`SELECT * FROM shc_tiffin_kitchen_config WHERE cook_id = $1 LIMIT 1`, [cookId]);
    const prev = existing.rows[0];
    const payload = {
      id: prev?.id || `tiffin_cfg_${cookId}`,
      cook_id: cookId,
      enabled: data.enabled ?? prev?.enabled ?? false,
      tagline: data.tagline !== undefined ? data.tagline : prev?.tagline ?? null,
      eligible_product_ids: data.eligible_product_ids ?? prev?.eligible_product_ids ?? [],
      meals_per_week_options: data.meals_per_week_options ?? prev?.meals_per_week_options ?? [2, 3, 4],
      collection_days: data.collection_days ?? prev?.collection_days ?? [1, 2, 3, 4, 5],
      default_collection_slot:
        data.default_collection_slot ?? prev?.default_collection_slot ?? "18:00-19:00",
    };

    await pg.query(
      `INSERT INTO shc_tiffin_kitchen_config (
        id, cook_id, enabled, tagline, eligible_product_ids, meals_per_week_options, collection_days, default_collection_slot, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, now(), now()
      ) ON CONFLICT (cook_id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        tagline = EXCLUDED.tagline,
        eligible_product_ids = EXCLUDED.eligible_product_ids,
        meals_per_week_options = EXCLUDED.meals_per_week_options,
        collection_days = EXCLUDED.collection_days,
        default_collection_slot = EXCLUDED.default_collection_slot,
        updated_at = now()`,
      [
        payload.id,
        payload.cook_id,
        payload.enabled,
        payload.tagline,
        JSON.stringify(payload.eligible_product_ids),
        JSON.stringify(payload.meals_per_week_options),
        JSON.stringify(payload.collection_days),
        payload.default_collection_slot,
      ]
    );

    const r = await pg.query(`SELECT * FROM shc_tiffin_kitchen_config WHERE cook_id = $1 LIMIT 1`, [cookId]);
    return shapeRow(r.rows[0]);
  });
}

export type TiffinSubMeta = {
  subscription_id: string;
  flex_quota: number;
  flex_remaining: number;
  paused_until: string | null;
  expires_on: string | null;
  cancel_reason: string | null;
  deliveries_left: number | null;
  balance_cents: number;
};

export type TiffinLedgerRow = {
  id: string;
  subscription_id: string;
  kind: string;
  label: string;
  amount_cents: number;
  delta_deliveries: number;
  delta_flex: number;
  paynow_ref: string | null;
  created_at: string;
};

function shapeSubMeta(row: any): TiffinSubMeta {
  return {
    subscription_id: row.subscription_id,
    flex_quota: row.flex_quota,
    flex_remaining: row.flex_remaining,
    paused_until: row.paused_until,
    expires_on: row.expires_on,
    cancel_reason: row.cancel_reason,
    deliveries_left: row.deliveries_left != null ? Number(row.deliveries_left) : null,
    balance_cents: row.balance_cents != null ? Number(row.balance_cents) : 0,
  };
}

export async function pgEnsureSubMeta(subscriptionId: string, mealsPerWeek: number): Promise<TiffinSubMeta> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const quota = defaultFlexQuota(mealsPerWeek);
    const defaultDeliveries = mealsPerWeek * 4; // ~1 month
    await pg.query(
      `INSERT INTO shc_tiffin_sub_meta (subscription_id, flex_quota, flex_remaining, expires_on, deliveries_left, updated_at)
       VALUES ($1, $2, $2, $3, $4, now())
       ON CONFLICT (subscription_id) DO NOTHING`,
      [subscriptionId, quota, addDaysIso(new Date().toISOString().slice(0, 10), 28), defaultDeliveries]
    );
    const r = await pg.query(`SELECT * FROM shc_tiffin_sub_meta WHERE subscription_id = $1`, [subscriptionId]);
    return shapeSubMeta(r.rows[0]);
  });
}

export async function pgUpdateSubMeta(
  subscriptionId: string,
  patch: Partial<TiffinSubMeta>
): Promise<TiffinSubMeta> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const cur = await pg.query(`SELECT * FROM shc_tiffin_sub_meta WHERE subscription_id = $1`, [subscriptionId]);
    if (!cur.rows[0]) {
      await pg.query(
        `INSERT INTO shc_tiffin_sub_meta (subscription_id, flex_quota, flex_remaining, updated_at)
         VALUES ($1, 2, 2, now())`,
        [subscriptionId]
      );
    }
    const prev = (await pg.query(`SELECT * FROM shc_tiffin_sub_meta WHERE subscription_id = $1`, [subscriptionId]))
      .rows[0];
    const next = {
      flex_quota: patch.flex_quota ?? prev.flex_quota,
      flex_remaining: patch.flex_remaining ?? prev.flex_remaining,
      paused_until: patch.paused_until !== undefined ? patch.paused_until : prev.paused_until,
      expires_on: patch.expires_on !== undefined ? patch.expires_on : prev.expires_on,
      cancel_reason: patch.cancel_reason !== undefined ? patch.cancel_reason : prev.cancel_reason,
      deliveries_left:
        patch.deliveries_left !== undefined ? patch.deliveries_left : prev.deliveries_left ?? null,
      balance_cents:
        patch.balance_cents !== undefined
          ? patch.balance_cents
          : prev.balance_cents != null
            ? Number(prev.balance_cents)
            : 0,
    };
    await pg.query(
      `UPDATE shc_tiffin_sub_meta SET
        flex_quota = $2, flex_remaining = $3, paused_until = $4, expires_on = $5, cancel_reason = $6,
        deliveries_left = $7, balance_cents = $8, updated_at = now()
       WHERE subscription_id = $1`,
      [
        subscriptionId,
        next.flex_quota,
        next.flex_remaining,
        next.paused_until,
        next.expires_on,
        next.cancel_reason,
        next.deliveries_left,
        next.balance_cents,
      ]
    );
    return { subscription_id: subscriptionId, ...next };
  });
}

export async function pgAddTiffinLedger(input: {
  subscriptionId: string;
  kind: string;
  label: string;
  amountCents?: number;
  deltaDeliveries?: number;
  deltaFlex?: number;
  paynowRef?: string | null;
}): Promise<TiffinLedgerRow> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const id = `tiffin_led_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await pg.query(
      `INSERT INTO shc_tiffin_ledger
        (id, subscription_id, kind, label, amount_cents, delta_deliveries, delta_flex, paynow_ref, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
      [
        id,
        input.subscriptionId,
        input.kind,
        input.label,
        input.amountCents ?? 0,
        input.deltaDeliveries ?? 0,
        input.deltaFlex ?? 0,
        input.paynowRef ?? null,
      ]
    );
    const r = await pg.query(`SELECT * FROM shc_tiffin_ledger WHERE id = $1`, [id]);
    const row = r.rows[0];
    return {
      id: row.id,
      subscription_id: row.subscription_id,
      kind: row.kind,
      label: row.label,
      amount_cents: Number(row.amount_cents),
      delta_deliveries: Number(row.delta_deliveries),
      delta_flex: Number(row.delta_flex),
      paynow_ref: row.paynow_ref,
      created_at: row.created_at?.toISOString?.() || String(row.created_at),
    };
  });
}

export async function pgListTiffinLedger(
  subscriptionId: string,
  limit = 40
): Promise<TiffinLedgerRow[]> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const r = await pg.query(
      `SELECT * FROM shc_tiffin_ledger
       WHERE subscription_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [subscriptionId, Math.min(100, Math.max(1, limit))]
    );
    return r.rows.map((row: any) => ({
      id: row.id,
      subscription_id: row.subscription_id,
      kind: row.kind,
      label: row.label,
      amount_cents: Number(row.amount_cents),
      delta_deliveries: Number(row.delta_deliveries),
      delta_flex: Number(row.delta_flex),
      paynow_ref: row.paynow_ref,
      created_at: row.created_at?.toISOString?.() || String(row.created_at),
    }));
  });
}

export async function pgListSkips(subscriptionId: string): Promise<string[]> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const r = await pg.query(`SELECT collection_date FROM shc_tiffin_skip WHERE subscription_id = $1`, [
      subscriptionId,
    ]);
    return r.rows.map((x: any) => x.collection_date as string);
  });
}

export async function pgAddSkip(subscriptionId: string, collectionDate: string): Promise<void> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    await pg.query(
      `INSERT INTO shc_tiffin_skip (id, subscription_id, collection_date, created_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (subscription_id, collection_date) DO NOTHING`,
      [`skip_${subscriptionId}_${collectionDate}`, subscriptionId, collectionDate]
    );
  });
}

export async function pgListKitchenCancels(cookId: string): Promise<string[]> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const r = await pg.query(`SELECT collection_date FROM shc_tiffin_kitchen_cancel WHERE cook_id = $1`, [cookId]);
    return r.rows.map((x: any) => x.collection_date as string);
  });
}

export async function pgAddKitchenCancel(cookId: string, collectionDate: string, reason?: string): Promise<void> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    await pg.query(
      `INSERT INTO shc_tiffin_kitchen_cancel (id, cook_id, collection_date, reason, created_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (cook_id, collection_date) DO UPDATE SET reason = EXCLUDED.reason`,
      [`kcancel_${cookId}_${collectionDate}`, cookId, collectionDate, reason || null]
    );
  });
}

export async function pgUpsertDayMenu(
  cookId: string,
  collectionDate: string,
  productIds: string[],
  note?: string
): Promise<void> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    await pg.query(
      `INSERT INTO shc_tiffin_day_menu (id, cook_id, collection_date, product_ids, note, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, now())
       ON CONFLICT (cook_id, collection_date) DO UPDATE SET
         product_ids = EXCLUDED.product_ids, note = EXCLUDED.note, updated_at = now()`,
      [`menu_${cookId}_${collectionDate}`, cookId, collectionDate, JSON.stringify(productIds), note || null]
    );
  });
}

export async function pgGetDayMenu(
  cookId: string,
  collectionDate: string
): Promise<{ product_ids: string[]; note: string | null } | null> {
  return withPg(async (pg) => {
    await ensureMetaTables(pg);
    const r = await pg.query(
      `SELECT product_ids, note FROM shc_tiffin_day_menu WHERE cook_id = $1 AND collection_date = $2`,
      [cookId, collectionDate]
    );
    if (!r.rows[0]) return null;
    return { product_ids: r.rows[0].product_ids || [], note: r.rows[0].note };
  });
}

export async function pgCountActiveSubscribers(cookId: string): Promise<number> {
  return withPg(async (pg) => {
    const r = await pg.query(
      `SELECT count(*)::int AS c FROM shc_tiffin_subscription WHERE cook_id = $1 AND status = 'active'`,
      [cookId]
    );
    return r.rows[0]?.c ?? 0;
  });
}

export async function pgSetSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
  return withPg(async (pg) => {
    // status column is enum active|cancelled in Mikro model; map paused→active + meta, canceled→cancelled
    const dbStatus = status === "canceled" || status === "cancelled" ? "cancelled" : "active";
    await pg.query(`UPDATE shc_tiffin_subscription SET status = $2 WHERE id = $1`, [subscriptionId, dbStatus]);
  });
}

export type PgTiffinSubscription = {
  id: string;
  customer_id: string;
  cook_id: string;
  meals_per_week: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

/** Direct Postgres active subscription — MikroORM list is unreliable on Railway. */
export async function pgGetActiveSubscription(customerId: string): Promise<PgTiffinSubscription | null> {
  return withPg(async (pg) => {
    const r = await pg.query(
      `SELECT * FROM shc_tiffin_subscription
       WHERE customer_id = $1 AND status = 'active'
       ORDER BY updated_at DESC NULLS LAST, created_at DESC
       LIMIT 1`,
      [customerId]
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      customer_id: row.customer_id,
      cook_id: row.cook_id,
      meals_per_week: Number(row.meals_per_week),
      status: row.status,
      created_at: row.created_at?.toISOString?.() || row.created_at,
      updated_at: row.updated_at?.toISOString?.() || row.updated_at,
    };
  });
}

export async function pgUpsertSubscription(input: {
  id: string;
  customerId: string;
  cookId: string;
  mealsPerWeek: number;
  status?: string;
}): Promise<PgTiffinSubscription> {
  return withPg(async (pg) => {
    await pg.query(
      `INSERT INTO shc_tiffin_subscription (id, customer_id, cook_id, meals_per_week, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       ON CONFLICT (id) DO UPDATE SET
         cook_id = EXCLUDED.cook_id,
         meals_per_week = EXCLUDED.meals_per_week,
         status = EXCLUDED.status,
         updated_at = now()`,
      [input.id, input.customerId, input.cookId, input.mealsPerWeek, input.status || "active"]
    );
    // If reusing active row by customer, update existing active
    await pg.query(
      `UPDATE shc_tiffin_subscription
       SET cook_id = $2, meals_per_week = $3, status = 'active', updated_at = now()
       WHERE customer_id = $1 AND status = 'active' AND id <> $4`,
      [input.customerId, input.cookId, input.mealsPerWeek, input.id]
    );
    const r = await pg.query(`SELECT * FROM shc_tiffin_subscription WHERE id = $1`, [input.id]);
    const row = r.rows[0];
    return {
      id: row.id,
      customer_id: row.customer_id,
      cook_id: row.cook_id,
      meals_per_week: Number(row.meals_per_week),
      status: row.status,
    };
  });
}

/** Prefer updating existing active sub for customer (one-kitchen rule). */
export async function pgCreateOrUpdateSubscription(input: {
  customerId: string;
  cookId: string;
  mealsPerWeek: number;
}): Promise<PgTiffinSubscription> {
  return withPg(async (pg) => {
    const existing = await pg.query(
      `SELECT * FROM shc_tiffin_subscription
       WHERE customer_id = $1 AND status = 'active' LIMIT 1`,
      [input.customerId]
    );
    if (existing.rows[0]) {
      await pg.query(
        `UPDATE shc_tiffin_subscription
         SET cook_id = $2, meals_per_week = $3, updated_at = now()
         WHERE id = $1`,
        [existing.rows[0].id, input.cookId, input.mealsPerWeek]
      );
      const r = await pg.query(`SELECT * FROM shc_tiffin_subscription WHERE id = $1`, [existing.rows[0].id]);
      const row = r.rows[0];
      return {
        id: row.id,
        customer_id: row.customer_id,
        cook_id: row.cook_id,
        meals_per_week: Number(row.meals_per_week),
        status: row.status,
      };
    }
    const id = `tiffin_sub_${Date.now()}`;
    await pg.query(
      `INSERT INTO shc_tiffin_subscription (id, customer_id, cook_id, meals_per_week, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', now(), now())`,
      [id, input.customerId, input.cookId, input.mealsPerWeek]
    );
    const planId = `tiffin_plan_tpl_${id}`;
    const existsPlan = await pg.query(`SELECT 1 FROM shc_tiffin_weekly_plan WHERE id = $1 LIMIT 1`, [planId]);
    if (!existsPlan.rows[0]) {
      await pg.query(
        `INSERT INTO shc_tiffin_weekly_plan (id, subscription_id, week_start, slots, created_at, updated_at)
         VALUES ($1, $2, NULL, '[]'::jsonb, now(), now())`,
        [planId, id]
      );
    }
    return {
      id,
      customer_id: input.customerId,
      cook_id: input.cookId,
      meals_per_week: input.mealsPerWeek,
      status: "active",
    };
  });
}

export type { TiffinPlanSlot };
