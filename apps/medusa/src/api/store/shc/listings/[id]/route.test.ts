import { describe, expect, it } from "vitest";
import { PATCH, DELETE } from "./route";
import { signShcToken } from "../../../../../lib/shc-auth";

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

function makeScope(meta: any, avail: any) {
  return {
    resolve(name: string) {
      if (name === "shcProductMeta") return meta;
      if (name === "shcAvailability") return avail;
      if (name === "shcCook") {
        return { listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch" }]] };
      }
      throw new Error(`Unknown dependency ${name}`);
    },
  };
}

describe("PATCH /store/shc/listings/:id", () => {
  it("updates a cook-owned listing", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let saved: any;
    const req: any = {
      params: { id: "dish_1" },
      headers: { authorization: `Bearer ${token}` },
      body: { name: "Updated Laksa", price: 20, min_qty: 2 },
      scope: makeScope(
        {
          getMetaForCook: async () => ({
            product_id: "dish_1",
            cook_id: "cook_1",
            name: "Launch Laksa",
            cuisine: "Peranakan",
            occasion_tags: [],
            allergen_tiers: { tier1: [] },
            halal: false,
            ingredients: [],
            min_qty: 1,
            price_cents: 1800,
          }),
          upsertProductMeta: async (data: any) => {
            saved = data;
            return { ...data, name: data.name };
          },
        },
        {
          upsertAvailability: async () => ({}),
          getAvailability: async () => ({ product_id: "dish_1", paused: false }),
        }
      ),
    };
    const res = makeRes();

    await PATCH(req, res);

    expect(res.statusCode).toBe(200);
    expect(saved.name).toBe("Updated Laksa");
    expect(saved.price_cents).toBe(2000);
    expect(res.body.listing.name).toBe("Updated Laksa");
  });

  it("returns 404 for another cook's listing", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_2", shc: true });
    const req: any = {
      params: { id: "dish_1" },
      headers: { authorization: `Bearer ${token}` },
      body: { price: 12 },
      scope: makeScope({ getMetaForCook: async () => null }, {}),
    };
    const res = makeRes();

    await PATCH(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /store/shc/listings/:id", () => {
  it("deletes a cook-owned listing", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let deletedId: string | undefined;
    const req: any = {
      params: { id: "dish_1" },
      headers: { authorization: `Bearer ${token}` },
      scope: makeScope(
        {
          getMetaForCook: async () => ({
            product_id: "dish_1",
            cook_id: "cook_1",
            name: "Launch Laksa",
            cuisine: "Peranakan",
            occasion_tags: [],
            allergen_tiers: { tier1: [] },
            halal: false,
            ingredients: [],
            min_qty: 1,
            price_cents: 1800,
          }),
          deleteProductMeta: async (id: string) => {
            deletedId = id;
          },
        },
        { deleteAvailabilityForProduct: async () => {} }
      ),
    };
    const res = makeRes();

    await DELETE(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(deletedId).toBe("dish_1");
  });
});