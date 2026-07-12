import { describe, expect, it } from "vitest";
import ShcDropModuleService from "./service";
import type { DropRow } from "./service";

/**
 * In-memory drop store exercising the real service methods (create/list/reserve)
 * without a live DB — same code paths as production via prototype assignment.
 */
function makeDropService(seed: DropRow[] = []) {
  const store = new Map<string, DropRow>();
  for (const row of seed) store.set(row.id, { ...row });
  let seq = 1;

  const service = Object.assign(Object.create(ShcDropModuleService.prototype), {
    async createDrops(rows: any[]) {
      return rows.map((r) => {
        const id = r.id || `drop_${seq++}`;
        const row: DropRow = {
          id,
          cook_id: r.cook_id,
          title: r.title,
          note: r.note ?? null,
          image_url: r.image_url ?? null,
          product_id: r.product_id ?? null,
          price_cents: r.price_cents,
          min_qty: r.min_qty ?? 0,
          max_qty: r.max_qty,
          ordered_qty: r.ordered_qty ?? 0,
          cook_date: r.cook_date,
          collection_slot: r.collection_slot,
          order_by: r.order_by,
          status: r.status || "open",
          visibility: r.visibility || "marketplace",
        };
        store.set(id, row);
        return row;
      });
    },
    async listAndCountDrops(filters: any = {}, _opts?: any) {
      let rows = Array.from(store.values());
      if (filters.id) rows = rows.filter((r) => r.id === filters.id);
      if (filters.cook_id) rows = rows.filter((r) => r.cook_id === filters.cook_id);
      if (filters.visibility) rows = rows.filter((r) => r.visibility === filters.visibility);
      if (filters.status) {
        const st = Array.isArray(filters.status) ? filters.status : [filters.status];
        rows = rows.filter((r) => st.includes(r.status));
      }
      return [rows, rows.length];
    },
    async updateDrops({ selector, data }: { selector: any; data: any }) {
      const match = (r: DropRow) => {
        if (selector.id && r.id !== selector.id) return false;
        if (selector.ordered_qty != null && Number(r.ordered_qty) !== Number(selector.ordered_qty)) return false;
        if (selector.status != null && r.status !== selector.status) return false;
        if (selector.cook_id && r.cook_id !== selector.cook_id) return false;
        return true;
      };
      const updated: DropRow[] = [];
      for (const [id, row] of store) {
        if (!match(row)) continue;
        const next = { ...row, ...data };
        store.set(id, next);
        updated.push(next);
      }
      return updated;
    },
    _store: store,
  }) as ShcDropModuleService & { _store: Map<string, DropRow> };

  return service;
}

function futureIso(hours = 12) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}
function pastIso() {
  return new Date(Date.now() - 3600_000).toISOString();
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("ShcDropModuleService cooking-soon flow", () => {
  it("create → list open marketplace → reserve reduces remaining", async () => {
    const svc = makeDropService();
    const created = await svc.createDrop({
      cook_id: "cook_rose",
      title: "Samosas",
      price_cents: 120,
      min_qty: 5,
      max_qty: 40,
      cook_date: tomorrow(),
      collection_slot: "18:00-19:00",
      order_by: futureIso(10),
      visibility: "marketplace",
    });
    expect(created.status).toBe("open");
    expect(created.remaining_qty).toBe(40);

    const listed = await svc.listMarketplace(20);
    expect(listed.some((d) => d.id === created.id)).toBe(true);
    expect(listed[0]).toMatchObject({
      title: expect.any(String),
      price_cents: expect.any(Number),
      cook_date: expect.any(String),
      collection_slot: expect.any(String),
      remaining_qty: expect.any(Number),
      order_by: expect.any(String),
    });
    expect(listed.every((d) => d.status === "open" && d.remaining_qty > 0)).toBe(true);

    const { drop, qty } = await svc.reserveQty(created.id, 12);
    expect(qty).toBe(12);
    expect(drop.ordered_qty).toBe(12);
    expect(drop.remaining_qty).toBe(28);

    const listedAfter = await svc.listMarketplace(20);
    const row = listedAfter.find((d) => d.id === created.id);
    expect(row?.remaining_qty).toBe(28);
  });

  it("listMarketplace excludes sold_out and expired order_by", async () => {
    const svc = makeDropService([
      {
        id: "drop_sold",
        cook_id: "c1",
        title: "Sold out kueh",
        price_cents: 100,
        min_qty: 0,
        max_qty: 10,
        ordered_qty: 10,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "sold_out",
        visibility: "marketplace",
      },
      {
        id: "drop_expired",
        cook_id: "c1",
        title: "Expired batch",
        price_cents: 100,
        min_qty: 0,
        max_qty: 10,
        ordered_qty: 0,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: pastIso(),
        status: "open",
        visibility: "marketplace",
      },
      {
        id: "drop_open",
        cook_id: "c1",
        title: "Open samosas",
        price_cents: 120,
        min_qty: 0,
        max_qty: 30,
        ordered_qty: 2,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "open",
        visibility: "marketplace",
      },
    ]);

    const listed = await svc.listMarketplace(20);
    expect(listed.map((d) => d.id)).toEqual(["drop_open"]);
    expect(listed[0].remaining_qty).toBe(28);
  });

  it("rejects reserve past order_by and over capacity", async () => {
    const svc = makeDropService([
      {
        id: "drop_dead",
        cook_id: "c1",
        title: "Late",
        price_cents: 100,
        min_qty: 0,
        max_qty: 5,
        ordered_qty: 0,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: pastIso(),
        status: "open",
        visibility: "marketplace",
      },
      {
        id: "drop_fullish",
        cook_id: "c1",
        title: "Almost full",
        price_cents: 100,
        min_qty: 0,
        max_qty: 5,
        ordered_qty: 4,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "open",
        visibility: "marketplace",
      },
    ]);

    await expect(svc.reserveQty("drop_dead", 1)).rejects.toMatchObject({
      message: expect.stringMatching(/closed|window/i),
    });

    // only 1 left — request 10 clamps to 1, succeeds
    const { qty, drop } = await svc.reserveQty("drop_fullish", 10);
    expect(qty).toBe(1);
    expect(drop.ordered_qty).toBe(5);
    expect(drop.status).toBe("sold_out");

    await expect(svc.reserveQty("drop_fullish", 1)).rejects.toMatchObject({
      message: expect.stringMatching(/sold out|sold_out|Cannot/i),
    });
  });

  it("CAS reserve prevents concurrent oversell past max_qty", async () => {
    const svc = makeDropService([
      {
        id: "drop_race",
        cook_id: "c1",
        title: "Race",
        price_cents: 100,
        min_qty: 0,
        max_qty: 10,
        ordered_qty: 8,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "open",
        visibility: "marketplace",
      },
    ]);

    // Two concurrent reserves of 2 each — only one should fully apply; total never > 10
    const results = await Promise.allSettled([svc.reserveQty("drop_race", 2), svc.reserveQty("drop_race", 2)]);
    const fulfilled = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<any>[];
    const rejected = results.filter((r) => r.status === "rejected");

    // At most remaining (2) can be reserved total
    const totalTaken = fulfilled.reduce((s, r) => s + r.value.qty, 0);
    expect(totalTaken).toBeLessThanOrEqual(2);
    expect(fulfilled.length + rejected.length).toBe(2);

    const final = await svc.getDrop("drop_race");
    expect(final!.ordered_qty).toBeLessThanOrEqual(10);
    expect(final!.ordered_qty).toBe(8 + totalTaken);
  });

  it("listForCook activeOnly only returns orderable batches", async () => {
    const svc = makeDropService([
      {
        id: "a",
        cook_id: "cook_1",
        title: "Open",
        price_cents: 100,
        min_qty: 0,
        max_qty: 5,
        ordered_qty: 0,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "open",
        visibility: "marketplace",
      },
      {
        id: "b",
        cook_id: "cook_1",
        title: "Sold",
        price_cents: 100,
        min_qty: 0,
        max_qty: 5,
        ordered_qty: 5,
        cook_date: tomorrow(),
        collection_slot: "18:00-19:00",
        order_by: futureIso(),
        status: "sold_out",
        visibility: "marketplace",
      },
    ]);
    const active = await svc.listForCook("cook_1", { activeOnly: true });
    expect(active.map((d) => d.id)).toEqual(["a"]);
  });
});
