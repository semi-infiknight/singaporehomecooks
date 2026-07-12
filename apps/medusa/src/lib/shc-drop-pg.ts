/**
 * Atomic capacity reserve for Cooking soon batches.
 * MedusaService.updateDrops is list-then-assign by PK (not WHERE CAS) — concurrent
 * orders can oversell. This path uses a single Postgres UPDATE … WHERE … RETURNING.
 */
// @ts-ignore pg resolved at runtime
import { Client } from "pg";

export type DropPgQueryResult = { rows: any[] };
export type DropPgExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<DropPgQueryResult>;
};

/** SQL used in production — kept as a constant so tests can assert the path. */
export const ATOMIC_RESERVE_SQL = `
UPDATE "shc_drop"
SET
  "ordered_qty" = "ordered_qty" + $2,
  "status" = CASE
    WHEN "ordered_qty" + $2 >= "max_qty" THEN 'sold_out'
    ELSE 'open'
  END,
  "updated_at" = NOW()
WHERE "id" = $1
  AND "status" = 'open'
  AND ("deleted_at" IS NULL)
  AND "ordered_qty" + $2 <= "max_qty"
  AND (
    CASE
      WHEN "order_by" ~ '^[0-9]{4}-' THEN "order_by"::timestamptz
      ELSE NULL
    END
  ) > $3::timestamptz
RETURNING *
`.trim();

/**
 * Attempt one atomic reserve of `take` units.
 * @returns updated row or null if WHERE matched 0 rows (sold out / closed / race lost / past order_by)
 */
export async function atomicReserveDropQty(
  exec: DropPgExecutor,
  id: string,
  take: number,
  now: Date = new Date()
): Promise<Record<string, unknown> | null> {
  const n = Math.floor(Number(take));
  if (!id || !Number.isFinite(n) || n < 1) return null;

  const r = await exec.query(ATOMIC_RESERVE_SQL, [id, n, now.toISOString()]);
  return (r.rows?.[0] as Record<string, unknown>) || null;
}

export async function withDropPg<T>(fn: (pg: Client) => Promise<T>): Promise<T> {
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

/** Production executor — one connection per reserve (same pattern as shc-tiffin-pg). */
export async function atomicReserveDropQtyFromDb(
  id: string,
  take: number,
  now: Date = new Date()
): Promise<Record<string, unknown> | null> {
  return withDropPg((pg) => atomicReserveDropQty(pg, id, take, now));
}

/**
 * In-memory executor that mirrors Postgres UPDATE … WHERE semantics for unit tests.
 * Check + write is synchronous (no await between), so concurrent Promise.all cannot oversell.
 */
export function createInMemoryDropCasExecutor(store: Map<string, any>): DropPgExecutor {
  return {
    async query(sql: string, params: unknown[] = []) {
      if (!sql.includes("UPDATE") || !sql.includes("shc_drop")) {
        return { rows: [] };
      }
      const id = String(params[0] ?? "");
      const take = Math.floor(Number(params[1]));
      const nowIso = String(params[2] ?? new Date().toISOString());
      const row = store.get(id);
      if (!row) return { rows: [] };
      if (row.deleted_at) return { rows: [] };
      if (row.status !== "open") return { rows: [] };
      const ordered = Number(row.ordered_qty || 0);
      const max = Number(row.max_qty || 0);
      if (ordered + take > max) return { rows: [] };
      const deadline = Date.parse(String(row.order_by || ""));
      if (!Number.isNaN(deadline) && deadline <= Date.parse(nowIso)) return { rows: [] };

      // Atomic mutate (sync) — production SQL is one statement
      row.ordered_qty = ordered + take;
      row.status = row.ordered_qty >= max ? "sold_out" : "open";
      row.updated_at = new Date().toISOString();
      store.set(id, row);
      return { rows: [{ ...row }] };
    },
  };
}
