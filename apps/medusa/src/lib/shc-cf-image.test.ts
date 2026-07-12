import { describe, expect, it } from "vitest";
import { buildFoodPhotoPrompt, compressListingImage, sharpEnhanceFoodPhoto } from "./shc-cf-image";
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
});
