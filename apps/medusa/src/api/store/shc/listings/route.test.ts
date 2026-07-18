import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";
import { signShcToken } from "../../../../lib/shc-auth";

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

describe("POST /store/shc/listings", () => {
  it("returns 401 when cook is not authenticated", async () => {
    const req: any = { headers: {}, body: { name: "No Auth Dish", price: 10 }, scope: { resolve: () => { throw new Error("should not resolve"); } } };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("persists cook-provided listing display fields for customer discovery", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    let savedMeta: any;
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: {
        name: "Launch Laksa",
        price: 18,
        min_qty: 3,
        cuisine: "Peranakan",
        description: "Coconut gravy family recipe",
        occasion_tags: ["Birthday"],
        ingredients: [{ name: "Prawn", quantity: 6, unit: "pcs" }],
        allergen_tiers: { tier1: ["Shellfish"], tier2: [], tier3: [] },
        image_url: "https://picsum.photos/seed/laksa/400/300",
      },
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
          if (name === "shcAvailability") {
            return {
              upsertAvailability: async () => ({}),
              getAvailability: async () => null,
            };
          }
          if (name === "shcCook") {
            return { listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch" }]] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.statusCode).toBe(201);
    expect(savedMeta.name).toBe("Launch Laksa");
    expect(savedMeta.price_cents).toBe(1800);
    expect(savedMeta.description).toBe("Coconut gravy family recipe");
    expect(res.body.product.name).toBe("Launch Laksa");
    expect(res.body.product.price).toBe(18);
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
            return { listAndCountProductMetas: async () => [[{ product_id: "dish_1", cook_id: "cook_1", name: "Launch Laksa", cuisine: "Peranakan", occasion_tags: [], allergen_tiers: { tier1: [] }, halal: false, ingredients: [], min_qty: 1, price_cents: 1800 }]] };
          }
          if (name === "shcAvailability") return { getAvailability: async () => null };
          if (name === "shcCook") return { listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch" }]] };
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
