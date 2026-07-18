/**
 * Cloudflare Workers AI — FLUX.1 [schnell] for cook listing photos.
 * Server-side only; free tier ~10k Neurons/day. Small output (512) then WebP.
 *
 * Env:
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN   (Workers AI permission)
 *   SHC_AI_IMAGE_STEPS     (default 4, max 8)
 *   SHC_AI_IMAGE_MAX_PX    (default 640)
 */

import sharp from "sharp";

const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export type FoodImageMode = "generate" | "enhance";

/** enhance_style: polish = sharp on your photo; restyle = FLUX from dish name (not img2img). */
export type EnhanceStyle = "polish" | "restyle";

/** SG marketplace cuisine chips for generate prompts + cook UI. */
export const FOOD_PHOTO_CUISINE_PRESETS = [
  "Peranakan",
  "Malay",
  "Chinese",
  "Indian",
  "Eurasian",
  "Western",
  "Fusion",
] as const;

export function isCloudflareImageConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() && process.env.CLOUDFLARE_API_TOKEN?.trim());
}

export function getAiImagePublicStatus() {
  const configured = isCloudflareImageConfigured();
  return {
    configured,
    modes: ["upload", "generate", "polish"] as const,
    model: CF_MODEL,
    max_px: Number(process.env.SHC_AI_IMAGE_MAX_PX || 640),
    rate_limit_per_hour: Number(process.env.SHC_AI_IMAGE_PER_COOK_HOUR || 30),
    cuisine_presets: [...FOOD_PHOTO_CUISINE_PRESETS],
    generate_available: configured,
    generate_unavailable_reason: configured
      ? null
      : "AI generate is offline — set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN on medusa",
    enhance_styles: {
      polish: "Brighten/contrast your upload (free, keeps your photo)",
      restyle: "Illustrative AI plate from dish name (uses FLUX; not your exact photo)",
    },
    note: "Cook JWT required for POST. Prefer real kitchen photos; AI is illustrative only.",
  };
}

export function buildFoodPhotoPrompt(input: {
  dish_name: string;
  cuisine?: string;
  enhance?: boolean;
}): string {
  const dish = (input.dish_name || "home cooked dish").trim().slice(0, 80);
  const cuisine = (input.cuisine || "Singapore").trim().slice(0, 40);
  return input.enhance
    ? `Professional food-app photograph of ${dish}, ${cuisine} cuisine, enhanced natural window light, appetizing steam if hot food, clean ceramic plate, shallow depth of field, photorealistic, no text, no watermark, no logo, high detail`
    : `Photorealistic plated ${dish}, ${cuisine} home kitchen Singapore, natural HDB window light, banana leaf or ceramic plate optional, appetizing, square food photography for delivery app, no text, no watermark, no hands, no logo`;
}

/**
 * Call Cloudflare FLUX.1 schnell → JPEG base64.
 */
export async function generateFluxImage(prompt: string, opts?: { steps?: number; seed?: number }): Promise<Buffer> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token) {
    throw new Error("Cloudflare Workers AI not configured (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)");
  }

  const steps = Math.min(8, Math.max(1, opts?.steps ?? Number(process.env.SHC_AI_IMAGE_STEPS || 4)));
  const seed = opts?.seed ?? Math.floor(Math.random() * 2_147_483_647);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.slice(0, 2048),
      steps,
      seed,
    }),
  });

  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.errors?.[0]?.message ||
      body?.error?.message ||
      body?.messages?.[0] ||
      `Cloudflare AI ${res.status}`;
    throw new Error(String(msg));
  }

  // Response shapes: { result: { image: base64 } } or { result: { image: "..." } } or { image }
  const b64 =
    body?.result?.image ||
    body?.result?.images?.[0] ||
    body?.image ||
    body?.result;
  if (typeof b64 !== "string" || b64.length < 32) {
    throw new Error("Cloudflare AI returned no image data");
  }
  const clean = b64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(clean, "base64");
}

/** Resize + WebP for listing cards (small file). */
export async function compressListingImage(input: Buffer, maxPx = 640): Promise<{ webp: Buffer; width: number; height: number }> {
  const max = Math.min(1024, Math.max(256, maxPx || Number(process.env.SHC_AI_IMAGE_MAX_PX || 640)));
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: max,
      height: max,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return {
    webp: data,
    width: info.width || max,
    height: info.height || max,
  };
}

/**
 * Non-AI enhance: normalize lighting/contrast for cook phone photos (always free).
 */
export async function sharpEnhanceFoodPhoto(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .normalize()
    .modulate({ brightness: 1.05, saturation: 1.08 })
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 88 })
    .toBuffer();
}

/**
 * Generate or enhance food listing image.
 * - generate: FLUX from dish name + cuisine
 * - enhance polish (default): sharp on uploaded pixels (always free)
 * - enhance restyle: FLUX from dish name (schnell has no img2img; upload ignored for pixels)
 */
export async function createListingFoodImage(input: {
  mode: FoodImageMode;
  dish_name: string;
  cuisine?: string;
  /** base64 of uploaded photo (required for enhance polish) */
  image_base64?: string;
  /**
   * enhance only. Prefer enhance_style.
   * ai_restyle true → restyle; false/undefined → polish (safe default — keeps cook photo).
   */
  ai_restyle?: boolean;
  enhance_style?: EnhanceStyle;
}): Promise<{
  buffer: Buffer;
  contentType: string;
  source: string;
  prompt?: string;
  enhance_style?: EnhanceStyle;
}> {
  if (input.mode === "enhance") {
    const style: EnhanceStyle =
      input.enhance_style === "restyle" || input.enhance_style === "polish"
        ? input.enhance_style
        : input.ai_restyle === true
          ? "restyle"
          : "polish";

    if (style === "restyle") {
      if (!isCloudflareImageConfigured()) {
        throw new Error("AI restyle requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
      }
      if (!input.dish_name?.trim()) throw new Error("dish_name required for AI restyle");
      // FLUX schnell: no img2img — plate is illustrative from metadata only
      const prompt = buildFoodPhotoPrompt({
        dish_name: input.dish_name,
        cuisine: input.cuisine,
        enhance: true,
      });
      const gen = await generateFluxImage(prompt, { steps: 4 });
      return {
        buffer: gen,
        contentType: "image/jpeg",
        source: "cloudflare-flux-restyle",
        prompt,
        enhance_style: "restyle",
      };
    }

    if (!input.image_base64) {
      throw new Error("image_base64 required for polish (your photo)");
    }
    const raw = Buffer.from(input.image_base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    if (raw.length < 100) throw new Error("Invalid image data");
    const polished = await sharpEnhanceFoodPhoto(raw);
    return {
      buffer: polished,
      contentType: "image/jpeg",
      source: "sharp-enhance",
      enhance_style: "polish",
    };
  }

  // generate
  if (!isCloudflareImageConfigured()) {
    throw new Error("AI generate requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
  }
  if (!input.dish_name?.trim()) throw new Error("dish_name required for generate");
  const prompt = buildFoodPhotoPrompt({
    dish_name: input.dish_name,
    cuisine: input.cuisine,
    enhance: false,
  });
  const gen = await generateFluxImage(prompt, { steps: 4 });
  return { buffer: gen, contentType: "image/jpeg", source: "cloudflare-flux", prompt };
}
