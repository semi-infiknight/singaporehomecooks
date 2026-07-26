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

describe("GET /store/shc/cooks/:slug/reviews", () => {
  it("returns cook review list and aggregate summary", async () => {
    const req: any = {
      params: { slug: "auntie-mei" },
      query: { limit: "10" },
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [
                [{ id: "cook_1", slug: "auntie-mei", display_name: "Auntie Mei" }],
                1,
              ],
            };
          }
          if (name === "shcReview") {
            return {
              getCookRatingSummary: async () => ({ rating: 4.6, review_count: 2 }),
              listCookReviews: async () => ({
                count: 2,
                reviews: [
                  {
                    id: "rev_1",
                    order_id: "ord_1",
                    customer_id: "cus_abc123",
                    rating: 5,
                    body: "Lovely nasi lemak",
                    created_at: "2026-07-20T10:00:00.000Z",
                  },
                  {
                    id: "rev_2",
                    order_id: "ord_2",
                    customer_id: "cus_xyz789",
                    rating: 4,
                    body: "Would order again",
                    created_at: "2026-07-18T10:00:00.000Z",
                  },
                ],
              }),
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.cook_id).toBe("cook_1");
    expect(res.body.summary).toEqual({ rating: 4.6, review_count: 2 });
    expect(res.body.count).toBe(2);
    expect(res.body.reviews).toHaveLength(2);
    expect(res.body.reviews[0].author_label).toMatch(/^Guest •/);
    expect(res.body.reviews[0].rating).toBe(5);
  });

  it("returns 404 when cook slug not found", async () => {
    const req: any = {
      params: { slug: "missing" },
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return { listAndCountCooks: async () => [[], 0] };
          }
          if (name === "shcReview") {
            return {};
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.statusCode).toBe(404);
  });
});
