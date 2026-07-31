/**
 * Ingredient → calorie estimate via free open nutrition APIs.
 * Primary: USDA FoodData Central (public domain, api.data.gov key).
 * Fallback: Open Food Facts (no key).
 * Last resort: lightweight keyword heuristic (offline).
 */

export type IngredientInput = { name: string; quantity: number; unit: string };

export type CalorieEstimateResult = {
  calories: number;
  confidence: "full" | "category";
  source: string;
  note: string;
  matched_ingredients: number;
  total_ingredients: number;
};

const USDA_ENERGY_NUTRIENT_IDS = new Set([1008]);
const USDA_ENERGY_NUTRIENT_NUMBERS = new Set(["208"]);

/** Convert cook-entered qty + unit to approximate grams. */
export function ingredientQuantityToGrams(quantity: number, unit: string): number {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return 0;
  const u = String(unit || "g")
    .toLowerCase()
    .trim();
  if (["g", "gram", "grams"].includes(u)) return q;
  if (["kg", "kilogram", "kilograms"].includes(u)) return q * 1000;
  if (u === "mg") return q / 1000;
  if (["ml", "milliliter", "millilitre", "milliliters"].includes(u)) return q;
  if (["l", "liter", "litre", "liters"].includes(u)) return q * 1000;
  if (["cup", "cups"].includes(u)) return q * 240;
  if (["tbsp", "tablespoon", "tablespoons"].includes(u)) return q * 15;
  if (["tsp", "teaspoon", "teaspoons"].includes(u)) return q * 5;
  if (["oz", "ounce", "ounces"].includes(u)) return q * 28.35;
  if (["lb", "pound", "pounds"].includes(u)) return q * 453.6;
  if (["pcs", "pc", "piece", "pieces", "whole", "serving", "servings"].includes(u)) return q * 100;
  return q * 100;
}

function heuristicKcalPer100g(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("oil") || n.includes("butter") || n.includes("ghee")) return 884;
  if (n.includes("rice") || n.includes("noodle") || n.includes("pasta")) return 130;
  if (n.includes("coconut") || n.includes("santan")) return 230;
  if (n.includes("prawn") || n.includes("shrimp") || n.includes("fish")) return 99;
  if (n.includes("chicken") || n.includes("ayam")) return 165;
  if (n.includes("beef") || n.includes("lamb") || n.includes("mutton")) return 250;
  if (n.includes("pork")) return 242;
  if (n.includes("egg")) return 155;
  if (n.includes("tofu") || n.includes("tempeh")) return 120;
  if (n.includes("potato")) return 77;
  if (n.includes("nut") || n.includes("peanut") || n.includes("keluak")) return 567;
  if (n.includes("sugar") || n.includes("gula")) return 387;
  if (n.includes("vegetable") || n.includes("spinach") || n.includes("kangkong")) return 35;
  return 150;
}

function extractUsdaKcalPer100g(nutrients: Array<{ nutrientId?: number; nutrientNumber?: string; value?: number }>): number | null {
  for (const n of nutrients || []) {
    if (!n || n.value == null) continue;
    if (USDA_ENERGY_NUTRIENT_IDS.has(Number(n.nutrientId)) || USDA_ENERGY_NUTRIENT_NUMBERS.has(String(n.nutrientNumber))) {
      const v = Number(n.value);
      return Number.isFinite(v) && v > 0 ? v : null;
    }
  }
  return null;
}

async function fetchUsdaKcalPer100g(
  name: string,
  fetchImpl: typeof fetch,
  apiKey: string
): Promise<{ kcalPer100g: number; label: string } | null> {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", name.trim());
  url.searchParams.set("pageSize", "3");
  url.searchParams.set("dataType", "Foundation,SR Legacy");
  url.searchParams.set("api_key", apiKey);

  const res = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { foods?: Array<{ description?: string; foodNutrients?: any[] }> };
  for (const food of data.foods || []) {
    const kcal = extractUsdaKcalPer100g(food.foodNutrients || []);
    if (kcal != null) {
      return { kcalPer100g: kcal, label: food.description || name };
    }
  }
  return null;
}

async function fetchOpenFoodFactsKcalPer100g(
  name: string,
  fetchImpl: typeof fetch
): Promise<{ kcalPer100g: number; label: string } | null> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", name.trim());
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "1");
  url.searchParams.set("fields", "product_name,nutriments");

  const res = await fetchImpl(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "SingaporeHomeCooks/1.0 (calorie-estimate)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { products?: Array<{ product_name?: string; nutriments?: Record<string, number> }> };
  const product = data.products?.[0];
  if (!product?.nutriments) return null;
  const kcal =
    Number(product.nutriments["energy-kcal_100g"]) ||
    Number(product.nutriments.energy_kcal_100g) ||
    (Number(product.nutriments.energy_100g) > 0 ? Number(product.nutriments.energy_100g) / 4.184 : 0);
  if (!Number.isFinite(kcal) || kcal <= 0) return null;
  return { kcalPer100g: kcal, label: product.product_name || name };
}

export async function estimateCaloriesFromIngredients(
  ingredients: IngredientInput[],
  opts: { fetchImpl?: typeof fetch; usdaApiKey?: string } = {}
): Promise<CalorieEstimateResult> {
  const fetchImpl = opts.fetchImpl || fetch;
  const apiKey = opts.usdaApiKey || process.env.USDA_FDC_API_KEY || process.env.FDC_API_KEY || "DEMO_KEY";

  let totalKcal = 0;
  let apiMatches = 0;
  let heuristicMatches = 0;
  const sources = new Set<string>();

  for (const ing of ingredients) {
    const grams = ingredientQuantityToGrams(ing.quantity, ing.unit);
    if (grams <= 0) continue;

    let kcalPer100g: number | null = null;
    let via: "usda" | "openfoodfacts" | "heuristic" | null = null;

    try {
      const usda = await fetchUsdaKcalPer100g(ing.name, fetchImpl, apiKey);
      if (usda) {
        kcalPer100g = usda.kcalPer100g;
        via = "usda";
        sources.add("USDA FoodData Central");
      }
    } catch {
      /* try fallback */
    }

    if (kcalPer100g == null) {
      try {
        const off = await fetchOpenFoodFactsKcalPer100g(ing.name, fetchImpl);
        if (off) {
          kcalPer100g = off.kcalPer100g;
          via = "openfoodfacts";
          sources.add("Open Food Facts");
        }
      } catch {
        /* try heuristic */
      }
    }

    if (kcalPer100g == null) {
      kcalPer100g = heuristicKcalPer100g(ing.name);
      via = "heuristic";
      heuristicMatches += 1;
    } else {
      apiMatches += 1;
    }

    totalKcal += (kcalPer100g * grams) / 100;
    void via;
  }

  const total = ingredients.length;
  const confidence: "full" | "category" =
    apiMatches >= 2 && apiMatches >= Math.ceil(total / 2) ? "full" : "category";

  const sourceList = [...sources];
  const source =
    sourceList.length > 0
      ? sourceList.join(" + ")
      : "Ingredient category estimates (no API match)";

  const calories = Math.min(5000, Math.max(50, Math.round(totalKcal)));

  return {
    calories,
    confidence,
    source,
    note: "Advisory estimate from ingredient nutrition databases. Not medical advice — verify for allergens and diets.",
    matched_ingredients: apiMatches,
    total_ingredients: total,
  };
}
