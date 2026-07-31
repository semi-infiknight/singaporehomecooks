import { describe, expect, it, vi } from "vitest";
import { estimateCaloriesFromIngredients, ingredientQuantityToGrams } from "./shc-calorie-estimate";

describe("shc-calorie-estimate", () => {
  it("converts common units to grams", () => {
    expect(ingredientQuantityToGrams(300, "g")).toBe(300);
    expect(ingredientQuantityToGrams(2, "pcs")).toBe(200);
    expect(ingredientQuantityToGrams(1, "cup")).toBe(240);
  });

  it("sums USDA-backed ingredient calories", async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("nal.usda.gov")) {
        return {
          ok: true,
          json: async () => ({
            foods: [
              {
                description: "Chicken, breast",
                foodNutrients: [{ nutrientId: 1008, value: 165 }],
              },
            ],
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    const result = await estimateCaloriesFromIngredients(
      [
        { name: "chicken breast", quantity: 300, unit: "g" },
        { name: "coconut milk", quantity: 200, unit: "ml" },
      ],
      { fetchImpl: fetchImpl as typeof fetch, usdaApiKey: "test-key" }
    );

    expect(result.calories).toBeGreaterThan(400);
    expect(result.source).toContain("USDA");
    expect(result.matched_ingredients).toBeGreaterThanOrEqual(1);
  });

  it("falls back to Open Food Facts when USDA misses", async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes("nal.usda.gov")) {
        return { ok: true, json: async () => ({ foods: [] }) } as Response;
      }
      if (url.includes("openfoodfacts.org")) {
        return {
          ok: true,
          json: async () => ({
            products: [{ product_name: "Coconut milk", nutriments: { "energy-kcal_100g": 230 } }],
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    const result = await estimateCaloriesFromIngredients(
      [{ name: "coconut milk", quantity: 100, unit: "g" }],
      { fetchImpl: fetchImpl as typeof fetch }
    );

    expect(result.calories).toBe(230);
    expect(result.source).toContain("Open Food Facts");
  });
});
