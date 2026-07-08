import { describe, expect, it } from "vitest";
import { canTransition } from "@shc/business-rules";
import { POST as registerCook } from "./register/route";
import { PATCH as patchProfile } from "./profile/route";
import { POST as createListing } from "../../listings/route";
import { POST as transitionOrder } from "../../orders/[id]/transition/route";
import { GET as listCookOrders } from "../../orders/route";

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("cook ↔ customer wiring (in-process handlers)", () => {
  it("register → profile → listing → cook orders → accept and decline", async () => {
    const cooks: any[] = [];
    const metas: any[] = [];
    const orders: Record<string, any> = {
      ord_accept: { order_id: "ord_accept", cook_id: "", shc_status: "paid", customer_id: "cust_1" },
      ord_decline: { order_id: "ord_decline", cook_id: "", shc_status: "paid", customer_id: "cust_1" },
    };

    const cookService = {
      findByLoginEmail: async () => null,
      createCook: async (data: any) => {
        cooks.push(data);
        return data;
      },
      updateCooks: async ({ selector, data }: any) => {
        const row = cooks.find((c) => c.id === selector.id);
        if (row) Object.assign(row, data);
      },
      listAndCountCooks: async (filters: any) => {
        const row = cooks.find((c) => c.id === filters.id);
        return [row ? [row] : [], row ? 1 : 0];
      },
    };

    const metaService = {
      upsertProductMeta: async (meta: any) => {
        metas.push(meta);
        return meta;
      },
      listAndCountProductMetas: async (where: any) => {
        const rows = metas.filter((m) => !where.cook_id || m.cook_id === where.cook_id);
        return [rows, rows.length];
      },
      listAndCountOrderMetas: async (where: any) => {
        let rows = Object.values(orders) as any[];
        if (where.order_id) rows = rows.filter((o) => o.order_id === where.order_id);
        if (where.cook_id) rows = rows.filter((o) => o.cook_id === where.cook_id);
        return [rows, rows.length];
      },
      transitionOrderState: async (orderId: string, to: string, actor?: string) => {
        const current = orders[orderId];
        if (!current) return { meta: null, valid: false, error: "not found" };
        if (actor && current.cook_id !== actor) return { meta: current, valid: false, error: "wrong cook" };
        const from = current.shc_status;
        if (!canTransition(from, to as any)) {
          return { meta: current, valid: false, error: `Invalid ${from}->${to}` };
        }
        current.shc_status = to;
        return { meta: current, valid: true };
      },
      getOrderMetaWithMessages: async (orderId: string) => {
        const meta = orders[orderId];
        return { meta, messages: [] };
      },
    };

    const scope = {
      resolve(name: string) {
        if (name === "shcCook") return cookService;
        if (name === "shcProductMeta") return metaService;
        if (name === "shcAvailability") {
          return { upsertAvailability: async () => ({}), getAvailability: async () => null };
        }
        if (name === "shcOrderMeta") return metaService;
        if (name === "shcLedger") {
          return { getLedgerSummaryForOrders: async () => ({ totalCookEarnings: 0, totalPlatformFees: 0, entries: [] }) };
        }
        if (name === "shcNotification") return { createNotifications: async () => [], push: async () => [] };
        if (name === "shcCreditWallet") return { awardCredits: async () => ({}), awardCreditsOnComplete: async () => ({}) };
        if (name === "logger") return console;
        throw new Error(`Unknown ${name}`);
      },
    };

    const regRes = makeRes();
    await registerCook(
      {
        body: {
          email: "wiring@test.local",
          password: "secret12",
          display_name: "Wiring Cook",
          area: "Bedok",
        },
        headers: { "x-forwarded-for": "127.0.0.1" },
        scope,
      } as any,
      regRes
    );
    expect(regRes.statusCode).toBe(201);
    const cookId = regRes.body.user.id as string;
    const cookToken = regRes.body.token as string;

    const profRes = makeRes();
    await patchProfile(
      {
        body: { story: "Heritage kitchen", pdpa_consent: true },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      profRes
    );
    expect(profRes.statusCode).toBe(200);

    const listRes = makeRes();
    await createListing(
      {
        body: { name: "Wiring Dish", price: 12, min_qty: 3, cuisine: "Local" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      listRes
    );
    expect(listRes.statusCode).toBe(201);
    expect(listRes.body.product.cook_id).toBe(cookId);

    orders.ord_accept.cook_id = cookId;
    orders.ord_decline.cook_id = cookId;

    const ordersRes = makeRes();
    await listCookOrders(
      {
        query: { role: "cook" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      ordersRes
    );
    expect(ordersRes.statusCode, JSON.stringify(ordersRes.body)).toBe(200);
    expect(ordersRes.body.orders.length).toBeGreaterThanOrEqual(2);

    const acceptRes = makeRes();
    await transitionOrder(
      {
        params: { id: "ord_accept" },
        body: { to: "accepted" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      acceptRes
    );
    expect(acceptRes.statusCode).toBe(200);
    expect(orders.ord_accept.shc_status).toBe("accepted");

    const declineRes = makeRes();
    await transitionOrder(
      {
        params: { id: "ord_decline" },
        body: { to: "cancelled" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      declineRes
    );
    expect(declineRes.statusCode).toBe(200);
    expect(orders.ord_decline.shc_status).toBe("cancelled");
  });
});