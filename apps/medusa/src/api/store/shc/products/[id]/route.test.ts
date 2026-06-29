import { describe, expect, it } from "vitest";
import { GET } from "./route";

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

describe("GET /store/shc/products/:id", () => {
  it("returns persisted cook-created display fields", async () => {
    const req: any = {
      params: { id: "dish_launch_laksa_1" },
      scope: {
        resolve(name: string) {
          if (name === "shcProductMeta") {
            return {
              getMetaForProduct: async () => ({
                product_id: "dish_launch_laksa_1",
                cook_id: "cook_1",
                name: "Launch Laksa",
                description: "Coconut gravy family recipe",
                cuisine: "Peranakan",
                occasion_tags: ["Birthday"],
                allergen_tiers: { tier1: ["Shellfish"] },
                halal: false,
                calories: 520,
                calories_confidence: "full",
                ingredients: [{ name: "Prawn", quantity: 6, unit: "pcs" }],
                min_qty: 3,
                price_cents: 1800,
                heritage_note: "Katong weekend special",
                image_url: "https://example.com/laksa.webp",
              }),
            };
          }
          if (name === "shcAvailability") return { getAvailability: async () => null };
          if (name === "shcCook") {
            return { listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-launch", display_name: "Auntie Launch" }]] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.product.name).toBe("Launch Laksa");
    expect(res.body.product.price).toBe(18);
    expect(res.body.product.description).toBe("Coconut gravy family recipe");
    expect(res.body.product.heritage_note).toBe("Katong weekend special");
    expect(res.body.product.image_url).toBe("https://example.com/laksa.webp");
  });
});
