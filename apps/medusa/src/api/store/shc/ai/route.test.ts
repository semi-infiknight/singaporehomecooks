import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("../../../../lib/shc-calorie-estimate", () => ({
  estimateCaloriesFromIngredients: vi.fn(async (ingredients: unknown[]) => ({
    calories: 475,
    confidence: "category",
    source: "USDA FoodData Central",
    note: "Advisory estimate from ingredient nutrition databases. Not medical advice — verify for allergens and diets.",
    matched_ingredients: 1,
    total_ingredients: (ingredients as unknown[]).length,
  })),
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

function makeReq(body: unknown) {
  return {
    body,
    scope: { resolve: () => console },
    auth: { actor_id: "cook_1" },
  } as any;
}

describe("POST /store/shc/ai", () => {
  it("returns calorie estimate for valid ingredients", async () => {
    const res = makeRes();
    await POST(
      makeReq({
        ingredients: [
          { name: "chicken breast", quantity: 300, unit: "g" },
          { name: "coconut milk", quantity: 200, unit: "ml" },
        ],
      }),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.calories).toBe(475);
    expect(res.body.confidence).toBe("category");
    expect(res.body.matched_ingredients).toBe(1);
    expect(res.body.total_ingredients).toBe(2);
  });

  it("rejects empty ingredients array", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [] }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejects missing ingredients", async () => {
    const res = makeRes();
    await POST(makeReq({}), res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects ingredient with negative quantity", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [{ name: "rice", quantity: -1, unit: "g" }] }), res);
    expect(res.statusCode).toBe(400);
  });

  it("accepts name-only ingredients with default qty/unit", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [{ name: "Chicken" }, { name: "Coconut" }] }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.calories).toBe(475);
  });

  it("rejects empty ingredient name", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [{ name: "", quantity: 100, unit: "g" }] }), res);
    expect(res.statusCode).toBe(400);
  });

  it("allows zero quantity garnish lines (skipped in estimate)", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [{ name: "parsley", quantity: 0, unit: "g" }] }), res);
    expect(res.statusCode).toBe(200);
  });

  it("rejects ingredient missing name", async () => {
    const res = makeRes();
    await POST(makeReq({ ingredients: [{ quantity: 100, unit: "g" }] }), res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects unknown extra fields (strict schema)", async () => {
    const res = makeRes();
    await POST(
      makeReq({
        ingredients: [{ name: "rice", quantity: 100, unit: "g" }],
        surprise: true,
      }),
      res
    );
    expect(res.statusCode).toBe(400);
  });

  it("accepts optional photo_url", async () => {
    const res = makeRes();
    await POST(
      makeReq({
        ingredients: [{ name: "rice", quantity: 100, unit: "g" }],
        photo_url: "https://example.com/dish.jpg",
      }),
      res
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /store/shc/ai", () => {
  it("returns photo tips", async () => {
    const res = makeRes();
    await GET({ scope: { resolve: () => console } } as any, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.tips).toHaveLength(3);
    expect(res.body.source).toContain("Singapore Home Cooks");
  });
});
