import { Client } from "pg";

function parseJson<T>(val: unknown, fallback: T): T {
  if (val == null) return fallback;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapRow(row: Record<string, unknown>) {
  return {
    ...row,
    occasion_tags: parseJson(row.occasion_tags, []),
    allergen_tiers: parseJson(row.allergen_tiers, { tier1: [], tier2: [], tier3: [] }),
    ingredients: parseJson(row.ingredients, []),
  };
}

export async function listProductMetasFromDb(limit = 200): Promise<any[]> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return [];
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();
  try {
    const r = await pg.query(`SELECT * FROM shc_product_meta ORDER BY product_id LIMIT $1`, [limit]);
    return r.rows.map(mapRow);
  } finally {
    await pg.end().catch(() => {});
  }
}

export async function getProductMetaFromDb(productId: string): Promise<any | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();
  try {
    const r = await pg.query(`SELECT * FROM shc_product_meta WHERE product_id = $1 LIMIT 1`, [productId]);
    return r.rows[0] ? mapRow(r.rows[0]) : null;
  } finally {
    await pg.end().catch(() => {});
  }
}