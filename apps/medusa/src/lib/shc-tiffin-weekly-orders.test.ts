import { describe, expect, it } from "vitest";
import {
  materializeTiffinWeeklyOrders,
  tiffinOrderId,
  type TiffinWeeklyOrdersDb,
} from "./shc-tiffin-weekly-orders";

function mockDb(state: {
  subs?: any[];
  plans?: Record<string, any[]>;
  configs?: Record<string, any>;
  products?: Record<string, any>;
  existingOrders?: Set<string>;
  inserts?: any[];
}): TiffinWeeklyOrdersDb {
  const orders = state.existingOrders || new Set<string>();
  const inserts = state.inserts || [];

  return {
    async query(sql: string, params?: unknown[]) {
      if (sql.includes("shc_tiffin_subscription")) {
        return { rows: state.subs || [] };
      }
      if (sql.includes("shc_tiffin_weekly_plan")) {
        const subId = params?.[0] as string;
        return { rows: state.plans?.[subId] || [] };
      }
      if (sql.includes("shc_tiffin_kitchen_config")) {
        const cookId = params?.[0] as string;
        const cfg = state.configs?.[cookId];
        return { rows: cfg ? [cfg] : [] };
      }
      if (sql.includes("SELECT order_id FROM shc_order_meta")) {
        const orderId = params?.[0] as string;
        return { rows: orders.has(orderId) ? [{ order_id: orderId }] : [] };
      }
      if (sql.includes("shc_product_meta")) {
        const pid = params?.[0] as string;
        const p = state.products?.[pid];
        return { rows: p ? [p] : [] };
      }
      if (sql.includes("INSERT INTO shc_order_meta")) {
        inserts.push(params);
        orders.add(params?.[1] as string);
        return { rows: [] };
      }
      return { rows: [] };
    },
  };
}

describe("materializeTiffinWeeklyOrders", () => {
  it("creates shc_order_meta rows from active subscription template plan", async () => {
    const inserts: unknown[][] = [];
    const db = mockDb({
      subs: [
        {
          id: "tiffin_sub_abc12345",
          customer_id: "cust_1",
          cook_id: "cook_rose",
          meals_per_week: 2,
          status: "active",
        },
      ],
      plans: {
        tiffin_sub_abc12345: [
          {
            week_start: null,
            slots: [
              { day_of_week: 1, product_id: "dish_nasi_001" },
              { day_of_week: 3, product_id: "dish_keluak_002" },
            ],
          },
        ],
      },
      configs: {
        cook_rose: { default_collection_slot: "18:00-19:00" },
      },
      products: {
        dish_nasi_001: { product_id: "dish_nasi_001", name: "Nasi Lemak", price_cents: 1200, cook_id: "cook_rose" },
        dish_keluak_002: { product_id: "dish_keluak_002", name: "Ayam Buah Keluak", price_cents: 1500, cook_id: "cook_rose" },
      },
      inserts,
    });

    const result = await materializeTiffinWeeklyOrders(db, "2026-07-06");

    expect(result.created).toBe(2);
    expect(result.order_ids).toHaveLength(2);
    expect(result.order_ids[0]).toBe(tiffinOrderId("tiffin_sub_abc12345", "2026-07-06", 1));
    expect(inserts).toHaveLength(2);
    expect(inserts[0]?.[1]).toBe("TIFFIN-abc12345-2026-07-06-1");
    expect(inserts[0]?.[3]).toBe("cust_1");
    expect(inserts[0]?.[2]).toBe("cook_rose");
    expect(String(inserts[0]?.[8])).toContain("tiffin:tiffin_sub_abc12345:2026-07-06");
  });

  it("prefers next-week override over recurring template", async () => {
    const inserts: unknown[][] = [];
    const db = mockDb({
      subs: [{ id: "tiffin_sub_xyz", customer_id: "cust_2", cook_id: "cook_rose", status: "active" }],
      plans: {
        tiffin_sub_xyz: [
          { week_start: null, slots: [{ day_of_week: 1, product_id: "dish_tpl" }] },
          { week_start: "2026-07-13", slots: [{ day_of_week: 2, product_id: "dish_override" }] },
        ],
      },
      configs: { cook_rose: { default_collection_slot: "18:00-19:00" } },
      products: {
        dish_tpl: { product_id: "dish_tpl", name: "Template", price_cents: 1000, cook_id: "cook_rose" },
        dish_override: { product_id: "dish_override", name: "Override", price_cents: 1100, cook_id: "cook_rose" },
      },
      inserts,
    });

    const result = await materializeTiffinWeeklyOrders(db, "2026-07-13");

    expect(result.created).toBe(1);
    expect(inserts[0]?.[1]).toBe(tiffinOrderId("tiffin_sub_xyz", "2026-07-13", 2));
    const items = JSON.parse(inserts[0]?.[6] as string);
    expect(items[0].name).toBe("Override");
  });

  it("skips when order_id already exists (idempotent)", async () => {
    const existing = new Set(["TIFFIN-sub_idem-2026-07-06-1"]);
    const inserts: unknown[][] = [];
    const db = mockDb({
      subs: [{ id: "tiffin_sub_idem", customer_id: "cust_3", cook_id: "cook_rose", status: "active" }],
      plans: {
        tiffin_sub_idem: [{ week_start: null, slots: [{ day_of_week: 1, product_id: "dish_a" }] }],
      },
      configs: { cook_rose: {} },
      products: { dish_a: { product_id: "dish_a", name: "Dish A", price_cents: 900, cook_id: "cook_rose" } },
      existingOrders: existing,
      inserts,
    });

    const result = await materializeTiffinWeeklyOrders(db, "2026-07-06");

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(inserts).toHaveLength(0);
  });

  it("falls back to productTitleFromId when name is null", async () => {
    const inserts: unknown[][] = [];
    const db = mockDb({
      subs: [{ id: "tiffin_sub_fb", customer_id: "cust_4", cook_id: "cook_rose", status: "active" }],
      plans: {
        tiffin_sub_fb: [{ week_start: null, slots: [{ day_of_week: 1, product_id: "dish_nasi_lemak_prawn_001" }] }],
      },
      configs: { cook_rose: { default_collection_slot: "18:00-19:00" } },
      products: {
        dish_nasi_lemak_prawn_001: {
          product_id: "dish_nasi_lemak_prawn_001",
          name: null,
          price_cents: 1200,
          cook_id: "cook_rose",
        },
      },
      inserts,
    });

    const result = await materializeTiffinWeeklyOrders(db, "2026-07-06");

    expect(result.created).toBe(1);
    const items = JSON.parse(inserts[0]?.[6] as string);
    expect(items[0].name).toBe("Nasi Lemak Sambal Prawn");
  });
});