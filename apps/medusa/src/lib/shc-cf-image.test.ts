import { describe, expect, it } from "vitest";
import {
  buildFoodPhotoPrompt,
  compressListingImage,
  createListingFoodImage,
  FOOD_PHOTO_CUISINE_PRESETS,
  getAiImagePublicStatus,
  sharpEnhanceFoodPhoto,
} from "./shc-cf-image";
import sharp from "sharp";

describe("shc-cf-image prompts + compress", () => {
  it("builds SG food prompts without logos/text", () => {
    const p = buildFoodPhotoPrompt({
      dish_name: "Sambal Stingray",
      cuisine: "Malay",
      heritage_note: "Weekend BBQ",
    });
    expect(p).toMatch(/Sambal Stingray/i);
    expect(p).toMatch(/no text/i);
    expect(p).toMatch(/Malay/);
    expect(p.length).toBeLessThan(2048);
  });

  it("exposes cuisine presets + public status shape", () => {
    expect(FOOD_PHOTO_CUISINE_PRESETS).toContain("Peranakan");
    expect(FOOD_PHOTO_CUISINE_PRESETS).toContain("Malay");
    const st = getAiImagePublicStatus();
    expect(st.modes).toContain("generate");
    expect(st.cuisine_presets.length).toBeGreaterThan(3);
    expect(typeof st.generate_available).toBe("boolean");
  });

  it("compressListingImage produces small webp", async () => {
    const png = await sharp({
      create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 80, b: 40 } },
    })
      .png()
      .toBuffer();
    const { webp, width, height } = await compressListingImage(png, 640);
    expect(width).toBeLessThanOrEqual(640);
    expect(height).toBeLessThanOrEqual(640);
    expect(webp.length).toBeLessThan(png.length);
    expect(webp.length).toBeGreaterThan(100);
  });

  it("sharpEnhanceFoodPhoto returns jpeg buffer", async () => {
    const jpg = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .jpeg()
      .toBuffer();
    const out = await sharpEnhanceFoodPhoto(jpg);
    expect(out.length).toBeGreaterThan(100);
  });

  it("enhance defaults to polish (keeps upload), not restyle", async () => {
    const jpg = await sharp({
      create: { width: 200, height: 150, channels: 3, background: { r: 180, g: 90, b: 40 } },
    })
      .jpeg()
      .toBuffer();
    const made = await createListingFoodImage({
      mode: "enhance",
      dish_name: "Rendang",
      cuisine: "Malay",
      image_base64: jpg.toString("base64"),
      // no ai_restyle / enhance_style → polish
    });
    expect(made.source).toBe("sharp-enhance");
    expect(made.enhance_style).toBe("polish");
  });
});
