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

describe("GET /store/shc/cooks", () => {
  it("returns real review averages instead of hardcoded ratings", async () => {
    const req: any = {
      headers: { "x-publishable-api-key": "pk_test" },
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [
                [
                  { id: "cook_1", slug: "auntie-mei", display_name: "Auntie Mei", area: "Tampines", status: "active" },
                ],
                1,
              ],
            };
          }
          if (name === "shcReview") {
            return {
              getCookRatingSummary: async (cookId: string) =>
                cookId === "cook_1" ? { rating: 4.6, review_count: 12 } : { rating: null, review_count: 0 },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.cooks).toHaveLength(1);
    expect(res.body.cooks[0].rating).toBe(4.6);
    expect(res.body.cooks[0].review_count).toBe(12);
    expect(res.body.cooks[0].display_name).toBe("Auntie Mei");
  });
});
