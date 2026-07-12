import { describe, expect, it } from "vitest";
import {
  ATOMIC_RESERVE_SQL,
  atomicReserveDropQty,
  createInMemoryDropCasExecutor,
} from "./shc-drop-pg";

function seedStore(overrides: Record<string, unknown> = {}) {
  const store = new Map<string, any>();
  store.set("drop_1", {
    id: "drop_1",
    cook_id: "c1",
    title: "Samosas",
    price_cents: 120,
    min_qty: 0,
    max_qty: 10,
    ordered_qty: 8,
    cook_date: "2026-07-13",
    collection_slot: "18:00-19:00",
    order_by: new Date(Date.now() + 86400000).toISOString(),
    status: "open",
    visibility: "marketplace",
    deleted_at: null,
    ...overrides,
  });
  return store;
}

describe("atomicReserveDropQty (SQL CAS semantics)", () => {
  it("uses UPDATE WHERE ordered_qty capacity (not list-then-assign)", () => {
    expect(ATOMIC_RESERVE_SQL).toMatch(/UPDATE\s+"shc_drop"/i);
    expect(ATOMIC_RESERVE_SQL).toMatch(/ordered_qty"\s*\+\s*\$2\s*<=\s*"max_qty/);
    expect(ATOMIC_RESERVE_SQL).toMatch(/status"\s*=\s*'open'/);
    expect(ATOMIC_RESERVE_SQL).toMatch(/RETURNING\s+\*/i);
  });

  it("reserves when capacity remains", async () => {
    const store = seedStore();
    const exec = createInMemoryDropCasExecutor(store);
    const row = await atomicReserveDropQty(exec, "drop_1", 2);
    expect(row).toBeTruthy();
    expect(row!.ordered_qty).toBe(10);
    expect(row!.status).toBe("sold_out");
  });

  it("returns null when over capacity (WHERE fails)", async () => {
    const store = seedStore({ ordered_qty: 9 });
    const exec = createInMemoryDropCasExecutor(store);
    const row = await atomicReserveDropQty(exec, "drop_1", 2);
    expect(row).toBeNull();
    expect(store.get("drop_1").ordered_qty).toBe(9);
  });

  it("returns null when past order_by", async () => {
    const store = seedStore({ order_by: new Date(Date.now() - 1000).toISOString() });
    const exec = createInMemoryDropCasExecutor(store);
    const row = await atomicReserveDropQty(exec, "drop_1", 1);
    expect(row).toBeNull();
  });

  it("concurrent reserves cannot oversell past max_qty", async () => {
    const store = seedStore({ ordered_qty: 8, max_qty: 10 });
    const exec = createInMemoryDropCasExecutor(store);
    const results = await Promise.all([
      atomicReserveDropQty(exec, "drop_1", 2),
      atomicReserveDropQty(exec, "drop_1", 2),
      atomicReserveDropQty(exec, "drop_1", 2),
    ]);
    const ok = results.filter(Boolean);
    const totalAdded = ok.reduce((s, r) => s + 2, 0); // each success was take=2
    // Only 2 slots left — at most one success of take=2, or edge: never exceed max
    expect(store.get("drop_1").ordered_qty).toBeLessThanOrEqual(10);
    expect(store.get("drop_1").ordered_qty).toBe(8 + ok.length * 2 > 10 ? 10 : 8 + ok.length * 2);
    // With sync CAS, only first of concurrent 2-unit takes wins when remaining=2
    expect(ok.length).toBe(1);
    expect(totalAdded).toBe(2);
  });
});
