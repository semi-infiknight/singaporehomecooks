/**
 * Idempotent tiffin kitchen seed for Auntie Rose.
 * Safe to run on every deploy (does not require RAILWAY_RUN_SEED=true).
 *
 * Run:
 *   cd apps/medusa && pnpm exec tsx scripts/seed-tiffin.ts
 *   railway run --service medusa pnpm exec tsx scripts/seed-tiffin.ts
 */
import "dotenv/config";
// @ts-ignore pg resolved at runtime via tsx
import { Client } from "pg";

export const TIFFIN_ROSE_SEED = {
  id: "tiffin_cfg_rose",
  cook_id: "cook_rose_tampines_001",
  enabled: true,
  tagline: "Peranakan comfort — weekly tiffin from our Tampines HDB kitchen",
  eligible_product_ids: ["dish_nasi_lemak_prawn_001", "dish_ayam_buah_keluak_002"],
  meals_per_week_options: [2, 3, 4],
  collection_days: [1, 2, 3, 4, 5],
  default_collection_slot: "18:00-19:00",
} as const;

export async function seedTiffinKitchenConfig(connectionString?: string): Promise<{ ok: boolean; message: string }> {
  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) {
    return { ok: false, message: "DATABASE_URL not set" };
  }

  const pg = new Client({ connectionString: dbUrl });
  try {
    await pg.connect();

    // Ensure table exists (migration may have run; create IF NOT EXISTS as safety net)
    await pg.query(`
      CREATE TABLE IF NOT EXISTS "shc_tiffin_kitchen_config" (
        "id" text PRIMARY KEY,
        "cook_id" text NOT NULL UNIQUE,
        "enabled" boolean NOT NULL DEFAULT false,
        "tagline" text,
        "eligible_product_ids" jsonb NOT NULL DEFAULT '[]',
        "meals_per_week_options" jsonb NOT NULL DEFAULT '[2,3,4]',
        "collection_days" jsonb NOT NULL DEFAULT '[1,2,3,4,5]',
        "default_collection_slot" text NOT NULL DEFAULT '18:00-19:00',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

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
        TIFFIN_ROSE_SEED.id,
        TIFFIN_ROSE_SEED.cook_id,
        TIFFIN_ROSE_SEED.enabled,
        TIFFIN_ROSE_SEED.tagline,
        JSON.stringify(TIFFIN_ROSE_SEED.eligible_product_ids),
        JSON.stringify(TIFFIN_ROSE_SEED.meals_per_week_options),
        JSON.stringify(TIFFIN_ROSE_SEED.collection_days),
        TIFFIN_ROSE_SEED.default_collection_slot,
      ]
    );

    const { rows } = await pg.query(
      `SELECT cook_id, enabled FROM shc_tiffin_kitchen_config WHERE cook_id = $1`,
      [TIFFIN_ROSE_SEED.cook_id]
    );
    if (!rows.length || !rows[0].enabled) {
      return { ok: false, message: "Upsert ran but kitchen not enabled" };
    }
    return { ok: true, message: `tiffin kitchen enabled for ${TIFFIN_ROSE_SEED.cook_id}` };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  } finally {
    await pg.end().catch(() => {});
  }
}

async function main() {
  console.log("[SEED:TIFFIN] Ensuring Auntie Rose tiffin kitchen config...");
  const result = await seedTiffinKitchenConfig();
  if (!result.ok) {
    console.error("[SEED:TIFFIN] FAILED:", result.message);
    process.exit(1);
  }
  console.log("[SEED:TIFFIN] ✓", result.message);
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("seed-tiffin.ts") || process.argv[1].endsWith("seed-tiffin.js"));

if (isMain) {
  main().catch((e) => {
    console.error("[SEED:TIFFIN] Fatal:", e);
    process.exit(1);
  });
}
