import { describe, expect, it } from "vitest";
import { shapeProduct } from "./shc-product-shape";

describe("shapeProduct listing discovery", () => {
  it("uses cook-provided display fields instead of synthetic title/price", async () => {
    const scope = {
      resolve(name: string) {
        if (name === "shcCook") {
          return {
            listAndCountCooks: async () => [[{ id: "cook_1", slug: "auntie-rose", display_name: "Auntie Rose" }]],
          };
        }
        if (name === "shcAvailability") {
          return { getAvailability: async () => ({ slots: [{ date: "2026-07-01", slot: "18:00-19:00" }] }) };
        }
        throw new Error(`Unknown ${name}`);
      },
    };

    const shaped = await shapeProduct(
      {
        product_id: "dish_launch_laksa_001",
        cook_id: "cook_1",
        name: "Launch Laksa",
        price_cents: 1800,
        description: "Coconut gravy family recipe",
        heritage_note: "Katong weekend special",
        min_qty: 3,
        cuisine: "Peranakan",
      },
      scope
    );

    expect(shaped.name).toBe("Launch Laksa");
    expect(shaped.price).toBe(18);
    expect(shaped.description).toBe("Coconut gravy family recipe");
    expect(shaped.heritage_note).toBe("Katong weekend special");
    expect(shaped.cook_name).toBe("Auntie Rose");
  });

  it("falls back to product id title when name is missing", async () => {
    const scope = {
      resolve(name: string) {
        if (name === "shcCook") {
          return { listAndCountCooks: async () => [[{ display_name: "Cook" }]] };
        }
        if (name === "shcAvailability") {
          return { getAvailability: async () => null };
        }
        throw new Error(`Unknown ${name}`);
      },
    };

    const shaped = await shapeProduct(
      { product_id: "dish_nasi_lemak_prawn_001", cook_id: "cook_1", min_qty: 2 },
      scope
    );

    expect(shaped.name).not.toBe("");
    expect(shaped.price).toBe(24);
  });
});
