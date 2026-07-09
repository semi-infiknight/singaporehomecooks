/**
 * Direct Postgres access for tiffin kitchen config.
 * MikroORM list/create on shc_tiffin_kitchen_config was silently failing on Railway
 * (list returned [], create threw) while raw SQL worked — use pg for reliability.
 */
// @ts-ignore pg resolved at runtime
import { Client } from "pg";
import type { TiffinKitchenConfigDTO } from "../modules/shc-tiffin/service";

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
