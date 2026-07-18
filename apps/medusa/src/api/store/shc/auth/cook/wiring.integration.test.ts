import { describe, expect, it } from "vitest";
import { enforceOneCookOnAdd } from "@shc/business-rules";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import { signShcToken } from "../../../../../lib/shc-auth";
import { POST as registerCook } from "./register/route";
import { PATCH as patchProfile } from "./profile/route";
import { POST as createListing } from "../../listings/route";
import { POST as addToCart, DELETE as clearCart } from "../../cart/route";
import { POST as demoComplete } from "../../carts/demo-complete/route";
import { GET as listProducts } from "../../products/route";
import { GET as listCookOrders } from "../../orders/route";
import { POST as transitionOrder } from "../../orders/[id]/transition/route";

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

type CartItem = { product_id: string; name: string; qty: number; price: number; cook_id: string };

function buildInMemoryWiringScope() {
  const cooks: any[] = [];
  const metas: any[] = [];
  const carts: Record<string, { cook_id: string | null; items: CartItem[] }> = {};
  const orders: Record<string, any> = {};
  const messages: any[] = [];

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

  const productMetaService = {
    upsertProductMeta: async (meta: any) => {
      const idx = metas.findIndex((m) => m.product_id === meta.product_id);
      if (idx >= 0) metas[idx] = { ...metas[idx], ...meta };
      else metas.push(meta);
      return meta;
    },
    getMetaForProduct: async (productId: string) => metas.find((m) => m.product_id === productId) || null,
    listAndCountProductMetas: async (where: any) => {
      const rows = metas.filter((m) => !where.cook_id || m.cook_id === where.cook_id);
      return [rows, rows.length];
    },
  };

  const cartService = {
    getCart: async (customerId: string) => {
      const row = carts[customerId];
      return row ? { items: [...row.items], cookId: row.cook_id } : { items: [], cookId: null };
    },
    clearCart: async (customerId: string) => {
      carts[customerId] = { cook_id: null, items: [] };
      return { items: [], cookId: null };
    },
    addToCart: async (customerId: string, item: CartItem) => {
      const row = carts[customerId] || { cook_id: null, items: [] };
      const conflict = enforceOneCookOnAdd(row.cook_id, item.cook_id);
      if (!conflict.valid) throw new Error(conflict.error || "One cook per cart");
      if (!row.cook_id) row.cook_id = item.cook_id;
      const existing = row.items.find((i) => i.product_id === item.product_id);
      if (existing) existing.qty += item.qty;
      else row.items.push({ ...item });
      carts[customerId] = row;
      return { items: [...row.items], cookId: row.cook_id };
    },
  };

  const orderMetaProto = Object.create(ShcOrderMetaModuleService.prototype);
  const orderMetaService = Object.assign(orderMetaProto, {
    createOrUpdateMeta: async (data: any) => {
      orders[data.order_id] = { ...data, shc_status: data.shc_status || "paid" };
      return orders[data.order_id];
    },
    listAndCountOrderMetas: async (where: any) => {
      let rows = Object.values(orders) as any[];
      if (where.order_id) rows = rows.filter((o) => o.order_id === where.order_id);
      if (where.cook_id) rows = rows.filter((o) => o.cook_id === where.cook_id);
      return [rows, rows.length];
    },
    updateOrderMetas: async ({ selector, data }: any) => {
      const row = orders[selector.order_id];
      if (row) Object.assign(row, data);
      return [row];
    },
    addOrderMessage: async (orderId: string, senderActor: string, senderId: string, body: string) => {
      messages.push({ order_id: orderId, sender_actor: senderActor, sender_id: senderId, body });
      return messages[messages.length - 1];
    },
    getOrderMetaWithMessages: async (orderId: string) => ({
      meta: orders[orderId],
      messages: messages.filter((m) => m.order_id === orderId),
    }),
    transitionOrderState: async (orderId: string, to: string, actor?: string) => {
      const current = orders[orderId];
      if (!current) return { meta: null, valid: false, error: "Order meta not found" };
      if (actor && current.cook_id && current.cook_id !== actor) {
        return { meta: current, valid: false, error: "Cook does not own this order" };
      }
      current.shc_status = to;
      return { meta: current, valid: true };
    },
  });

  const scope = {
    resolve(name: string) {
      if (name === "shcCook") return cookService;
      if (name === "shcProductMeta") return productMetaService;
      if (name === "shcCart") return cartService;
      if (name === "shcAvailability") {
        return { upsertAvailability: async () => ({}), getAvailability: async () => null };
      }
      if (name === "shcOrderMeta") return orderMetaService;
      if (name === "shcLedger") {
        return { getLedgerSummaryForOrders: async () => ({ totalCookEarnings: 0, totalPlatformFees: 0, entries: [] }) };
      }
      if (name === "shcNotification") return { createNotifications: async () => [], push: async () => [] };
      if (name === "logger") return console;
      throw new Error(`Unknown ${name}`);
    },
  };

  return { scope, cooks, metas, carts, orders, orderMetaService };
}

describe("cook ↔ customer wiring (handler chain)", () => {
  it("register → listing → cart checkout → cook orders → accept/decline with cook_id propagation", async () => {
    const { scope, orders } = buildInMemoryWiringScope();
    const customerId = "cust_wiring_1";
    const customerToken = signShcToken({ actor_type: "customer", actor_id: customerId, shc: true });

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
    const productId = listRes.body.product.id as string;
    expect(listRes.body.product.cook_id).toBe(cookId);

    const productsRes = makeRes();
    await listProducts(
      { query: { cook_id: cookId, limit: "20" }, scope } as any,
      productsRes
    );
    expect(productsRes.statusCode).toBe(200);
    expect(productsRes.body.products.some((p: { id: string }) => p.id === productId)).toBe(true);

    await clearCart({ headers: { authorization: `Bearer ${customerToken}` }, scope } as any, makeRes());

    const cartRes = makeRes();
    await addToCart(
      {
        body: { product_id: productId, qty: 5 },
        headers: { authorization: `Bearer ${customerToken}` },
        scope,
      } as any,
      cartRes
    );
    expect(cartRes.statusCode).toBe(200);
    expect(cartRes.body.cart.cookId).toBe(cookId);

    const checkoutRes = makeRes();
    await demoComplete(
      {
        body: {
          collection_date: "2026-08-15",
          collection_slot: "18:00-19:00",
          allergen_acked: true,
          pdpa_consent: true,
        },
        headers: { authorization: `Bearer ${customerToken}` },
        scope,
      } as any,
      checkoutRes
    );
    expect(checkoutRes.statusCode, JSON.stringify(checkoutRes.body)).toBe(200);
    const acceptOrderId = checkoutRes.body.order.id as string;
    expect(checkoutRes.body.order.cook_id).toBe(cookId);

    const checkoutRes2 = makeRes();
    await addToCart(
      {
        body: { product_id: productId, qty: 5 },
        headers: { authorization: `Bearer ${customerToken}` },
        scope,
      } as any,
      makeRes()
    );
    await demoComplete(
      {
        body: {
          collection_date: "2026-08-16",
          collection_slot: "18:00-19:00",
          allergen_acked: true,
          pdpa_consent: true,
        },
        headers: { authorization: `Bearer ${customerToken}` },
        scope,
      } as any,
      checkoutRes2
    );
    expect(checkoutRes2.statusCode).toBe(200);
    const declineOrderId = checkoutRes2.body.order.id as string;
    expect(checkoutRes2.body.order.cook_id).toBe(cookId);

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
        params: { id: acceptOrderId },
        body: { to: "accepted" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      acceptRes
    );
    expect(acceptRes.statusCode).toBe(200);
    expect(orders[acceptOrderId].shc_status).toBe("accepted");

    const wrongCookToken = signShcToken({
      actor_type: "cook",
      actor_id: "cook_intruder",
      email: "intruder@test.local",
      shc: true,
    });
    const intruderRes = makeRes();
    await transitionOrder(
      {
        params: { id: declineOrderId },
        body: { to: "accepted" },
        headers: { authorization: `Bearer ${wrongCookToken}` },
        scope,
      } as any,
      intruderRes
    );
    expect(intruderRes.statusCode).toBe(400);

    const declineRes = makeRes();
    await transitionOrder(
      {
        params: { id: declineOrderId },
        body: { to: "cancelled" },
        headers: { authorization: `Bearer ${cookToken}` },
        scope,
      } as any,
      declineRes
    );
    expect(declineRes.statusCode).toBe(200);
    expect(orders[declineOrderId].shc_status).toBe("cancelled");
  });
});