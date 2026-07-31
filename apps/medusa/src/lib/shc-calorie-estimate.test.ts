import { describe, expect, it, vi } from "vitest";
import { estimateCaloriesFromIngredients, ingredientQuantityToGrams } from "./shc-calorie-estimate";

function mockFetch(routes: Record<string, () => Response | Promise<Response>>) {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    for (const [needle, handler] of Object.entries(routes)) {
      if (url.includes(needle)) return handler();
    }
    return { ok: false, status: 404 } as Response;
  });
}

describe("shc-calorie-estimate", () => {
  describe("ingredientQuantityToGrams", () => {
    it("converts common units to grams", () => {
      expect(ingredientQuantityToGrams(300, "g")).toBe(300);
      expect(ingredientQuantityToGrams(2, "pcs")).toBe(200);
      expect(ingredientQuantityToGrams(1, "cup")).toBe(240);
      expect(ingredientQuantityToGrams(1, "kg")).toBe(1000);
      expect(ingredientQuantityToGrams(500, "ml")).toBe(500);
      expect(ingredientQuantityToGrams(2, "l")).toBe(2000);
      expect(ingredientQuantityToGrams(2, "tbsp")).toBe(30);
      expect(ingredientQuantityToGrams(3, "tsp")).toBe(15);
      expect(ingredientQuantityToGrams(4, "oz")).toBeCloseTo(113.4, 1);
      expect(ingredientQuantityToGrams(1, "lb")).toBeCloseTo(453.6, 1);
      expect(ingredientQuantityToGrams(500, "mg")).toBe(0.5);
    });

    it("returns 0 for invalid or non-positive quantities", () => {
      expect(ingredientQuantityToGrams(0, "g")).toBe(0);
      expect(ingredientQuantityToGrams(-5, "g")).toBe(0);
      expect(ingredientQuantityToGrams(NaN, "g")).toBe(0);
      expect(ingredientQuantityToGrams(Infinity, "g")).toBe(0);
    });

    it("defaults empty unit to grams and uses piece fallback for unknown units", () => {
      expect(ingredientQuantityToGrams(10, "")).toBe(10);
      expect(ingredientQuantityToGrams(2, "bunch")).toBe(200);
    });
  });

  describe("estimateCaloriesFromIngredients", () => {
    it("sums USDA-backed ingredient calories", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [
                {
                  description: "Chicken, breast",
                  foodNutrients: [{ nutrientId: 1008, value: 165 }],
                },
              ],
            }),
          }) as Response,
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
      expect(result.total_ingredients).toBe(2);
      expect(result.note).toMatch(/not medical advice/i);
    });

    it("falls back to Open Food Facts when USDA misses", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () => ({ ok: true, json: async () => ({ foods: [] }) }) as Response,
        "openfoodfacts.org": () =>
          ({
            ok: true,
            json: async () => ({
              products: [{ product_name: "Coconut milk", nutriments: { "energy-kcal_100g": 230 } }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "coconut milk", quantity: 100, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBe(230);
      expect(result.source).toContain("Open Food Facts");
      expect(result.matched_ingredients).toBe(1);
      expect(result.confidence).toBe("category");
    });

    it("parses USDA energy via nutrientNumber 208", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [{ description: "Rice", foodNutrients: [{ nutrientNumber: "208", value: 130 }] }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "jasmine rice", quantity: 200, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch, usdaApiKey: "k" }
      );

      expect(result.calories).toBe(260);
      expect(result.source).toContain("USDA");
    });

    it("converts Open Food Facts kJ energy_100g to kcal", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () => ({ ok: true, json: async () => ({ foods: [] }) }) as Response,
        "openfoodfacts.org": () =>
          ({
            ok: true,
            json: async () => ({
              products: [{ product_name: "Snack", nutriments: { energy_100g: 418.4 } }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "mystery snack", quantity: 100, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBe(100);
    });

    it("uses heuristic when both APIs fail or error", async () => {
      const fetchImpl = vi.fn(async () => {
        throw new Error("network down");
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "ayam lemak", quantity: 200, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBeGreaterThanOrEqual(50);
      expect(result.source).toBe("Ingredient category estimates (no API match)");
      expect(result.matched_ingredients).toBe(0);
      expect(result.confidence).toBe("category");
    });

    it("uses heuristic for SG ingredient keywords (santan, keluak)", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () => ({ ok: false, status: 503 }) as Response,
        "openfoodfacts.org": () => ({ ok: false, status: 503 }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [
          { name: "santan", quantity: 100, unit: "ml" },
          { name: "buah keluak paste", quantity: 50, unit: "g" },
        ],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBeGreaterThan(200);
      expect(result.matched_ingredients).toBe(0);
    });

    it("skips zero-qty ingredients but still counts them in total_ingredients", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [{ foodNutrients: [{ nutrientId: 1008, value: 165 }] }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [
          { name: "chicken", quantity: 100, unit: "g" },
          { name: "garnish", quantity: 0, unit: "g" },
        ],
        { fetchImpl: fetchImpl as typeof fetch, usdaApiKey: "k" }
      );

      expect(result.calories).toBe(165);
      expect(result.total_ingredients).toBe(2);
      expect(result.confidence).toBe("category");
    });

    it("clamps total calories to minimum 50 when all quantities are zero", async () => {
      const fetchImpl = mockFetch({});

      const result = await estimateCaloriesFromIngredients(
        [{ name: "rice", quantity: 0, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBe(50);
      expect(result.matched_ingredients).toBe(0);
    });

    it("clamps total calories to maximum 5000 for huge portions", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [{ foodNutrients: [{ nutrientId: 1008, value: 884 }] }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "cooking oil", quantity: 10, unit: "kg" }],
        { fetchImpl: fetchImpl as typeof fetch, usdaApiKey: "k" }
      );

      expect(result.calories).toBe(5000);
    });

    it("sets confidence full when majority of ingredients match APIs", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [{ foodNutrients: [{ nutrientId: 1008, value: 100 }] }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [
          { name: "chicken", quantity: 100, unit: "g" },
          { name: "rice", quantity: 100, unit: "g" },
        ],
        { fetchImpl: fetchImpl as typeof fetch, usdaApiKey: "k" }
      );

      expect(result.confidence).toBe("full");
      expect(result.matched_ingredients).toBe(2);
    });

    it("skips USDA foods with no energy nutrients and tries next source", async () => {
      const fetchImpl = mockFetch({
        "nal.usda.gov": () =>
          ({
            ok: true,
            json: async () => ({
              foods: [{ foodNutrients: [{ nutrientId: 9999, value: 50 }] }],
            }),
          }) as Response,
        "openfoodfacts.org": () =>
          ({
            ok: true,
            json: async () => ({
              products: [{ nutriments: { energy_kcal_100g: 120 } }],
            }),
          }) as Response,
      });

      const result = await estimateCaloriesFromIngredients(
        [{ name: "tempeh", quantity: 100, unit: "g" }],
        { fetchImpl: fetchImpl as typeof fetch }
      );

      expect(result.calories).toBe(120);
      expect(result.source).toContain("Open Food Facts");
    });
  });
});
