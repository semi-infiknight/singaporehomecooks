import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";

vi.mock("../../../../lib/shc-cook-compliance", () => ({
  assertCookCanPublishListing: vi.fn(async () => ({ ok: true })),
}));

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

const validListingBody = {
  name: "Launch Laksa",
  price: 18,
  min_qty: 3,
  cuisine: "Peranakan",
  description: "Coconut gravy family recipe",
  occasion_tags: ["Birthday"],
  ingredients: [{ name: "Prawn", quantity: 6, unit: "pcs" }],
  allergen_tiers: { tier1: ["Shellfish"], tier2: [], tier3: [] },
  collection_days: [1, 2, 3, 4, 5],
  time_slots: ["18:00-19:00"],
  image_url: "https://picsum.photos/seed/laksa/400/300",
  meal_extras: [{ id: "rice", label: "Coconut rice", price_delta: 2 }],
  meal_addons: [{ id: "sambal", label: "Extra sambal", price_delta: 1.5 }],
  recipe_steps: [{ order: 1, instruction: "Simmer rempah until fragrant." }],
};

function makeScope() {
  return {
    resolve(name: string) {
      if (name === "shcProductMeta") {
        return {
          upsertProductMeta: async (meta: any) => meta,
        };
      }
      if (name === "shcAvailability") {
        return {
          upsertAvailability: async () => ({}),
          getAvailability: async () => null,
        };
      }
      if (name === "shcCook") {
        return {
          listAndCountCooks: async () => [
            [{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch", status: "active" }],
          ],
        };
      }
      throw new Error(`Unknown dependency ${name}`);
    },
  };
}

describe("POST /store/shc/listings", () => {
  it("returns 401 when cook is not authenticated", async () => {
    const req: any = {
      headers: {},
      body: validListingBody,
      scope: { resolve: () => { throw new Error("should not resolve"); } },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("persists cook-provided listing display fields for customer discovery", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let savedMeta: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: validListingBody,
      scope: {
        resolve(name: string) {
          if (name === "shcProductMeta") {
            return {
              upsertProductMeta: async (meta: any) => {
                savedMeta = meta;
                return meta;
              },
            };
          }
          return makeScope().resolve(name);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(201);
    expect(savedMeta.name).toBe("Launch Laksa");
    expect(savedMeta.price_cents).toBe(1800);
    expect(savedMeta.description).toBe("Coconut gravy family recipe");
    expect(savedMeta.meal_extras).toHaveLength(1);
    expect(savedMeta.recipe_steps).toHaveLength(1);
    expect(res.body.product.name).toBe("Launch Laksa");
    expect(res.body.product.price).toBe(18);
  });

  it("rejects incomplete listing payloads", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: {
        name: "Plain Curry",
        price: 16,
        min_qty: 2,
        cuisine: "Indian",
        allergen_tiers: { tier1: [], tier2: [], tier3: [] },
      },
      scope: makeScope(),
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /store/shc/listings", () => {
  it("returns the authenticated cook's listings", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      scope: {
        resolve(name: string) {
          if (name === "shcProductMeta") {
            return {
              listAndCountProductMetas: async () => [
                [
                  {
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
                  },
                ],
              ],
            };
          }
          if (name === "shcAvailability") return { getAvailability: async () => null };
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [
                [{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch" }],
              ],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].name).toBe("Launch Laksa");
  });
});
