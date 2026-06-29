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

describe("GET /store/shc/products", () => {
  it("uses search synonyms when filtering product discovery", async () => {
    const req: any = {
      query: { q: "sotong" },
      scope: {
        resolve(name: string) {
          if (name === "shcProductMeta") {
            return {
              listAndCountProductMetas: async () => [
                [
                  {
                    product_id: "dish_squid_sambal_001",
                    cook_id: "cook_1",
                    name: "Sambal Squid",
                    description: "Spicy seafood for family gatherings",
                    cuisine: "Malay",
                    min_qty: 2,
                    price_cents: 1600,
                    ingredients: [{ name: "Squid" }],
                  },
                  {
                    product_id: "dish_beef_rendang_001",
                    cook_id: "cook_1",
                    name: "Beef Rendang",
                    cuisine: "Malay",
                    min_qty: 2,
                    price_cents: 1800,
                    ingredients: [{ name: "Beef" }],
                  },
                ],
                2,
              ],
            };
          }
          if (name === "shcSearchSynonym") {
            return {
              listAndCountSearchSynonyms: async (filters: any) => {
                if (filters.term === "sotong") {
                  return [[{ term: "sotong", expansions: ["squid"] }], 1];
                }
                return [[{ term: "sotong", expansions: ["squid"] }], 1];
              },
            };
          }
          if (name === "shcAvailability") return { getAvailability: async () => null };
          if (name === "shcCook") {
            return { listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-seafood", display_name: "Auntie Seafood" }]] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe("Sambal Squid");
  });
});
