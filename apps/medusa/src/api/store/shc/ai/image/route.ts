import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../lib/shc-actors";
import { uploadBufferToMinIO } from "../../../../../lib/minio-client";
import {
  compressListingImage,
  createListingFoodImage,
  isCloudflareImageConfigured,
} from "../../../../../lib/shc-cf-image";
import { checkRateLimit, getRateLimitKey } from "../../../../../lib/shc-rate-limit";

/**
 * POST /store/shc/ai/image
 * Cook-only: generate (FLUX) or enhance (sharp / FLUX restyle) listing food photo.
 * Returns MinIO URL + small WebP derivative.
 *
 * Body:
 *   mode: "generate" | "enhance"
 *   dish_name: string
 *   cuisine?: string
 *   heritage_note?: string
 *   image_base64?: string  (required for enhance)
 *   ai_restyle?: boolean   (enhance: use FLUX when configured)
 */
const BodySchema = z
  .object({
    mode: z.enum(["generate", "enhance"]),
    dish_name: z.string().min(1).max(120),
    cuisine: z.string().max(60).optional(),
    heritage_note: z.string().max(300).optional(),
    image_base64: z.string().max(8_000_000).optional(),
    ai_restyle: z.boolean().optional(),
  })
  .strict();

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    configured: isCloudflareImageConfigured(),
    modes: ["generate", "enhance", "upload"],
    model: "@cf/black-forest-labs/flux-1-schnell",
    max_px: Number(process.env.SHC_AI_IMAGE_MAX_PX || 640),
    note: "Cook JWT required for POST. Free CF Workers AI neurons; soft per-cook rate limit.",
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }

  const rate = checkRateLimit(getRateLimitKey(req, `ai.image.${cookId}`), {
    max: Number(process.env.SHC_AI_IMAGE_PER_COOK_HOUR || 30),
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return res.status(429).json({
      error: createSHCError(
        "SHC-GENERIC-001",
        "AI image limit reached for this hour — try again later or upload a photo."
      ),
    });
  }

  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid AI image request", parse.error.format() as any) });
  }

  if (parse.data.mode === "generate" && !isCloudflareImageConfigured()) {
    return res.status(503).json({
      error: createSHCError(
        "SHC-GENERIC-001",
        "AI generate unavailable — set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN on medusa"
      ),
    });
  }

  try {
    const made = await createListingFoodImage({
      mode: parse.data.mode,
      dish_name: parse.data.dish_name,
      cuisine: parse.data.cuisine,
      heritage_note: parse.data.heritage_note,
      image_base64: parse.data.image_base64,
      ai_restyle: parse.data.ai_restyle,
    });

    const { webp, width, height } = await compressListingImage(made.buffer);
    const stamp = Date.now();
    const baseKey = `listings/${cookId}/ai-${parse.data.mode}-${stamp}`;
    const webpKey = `${baseKey}.webp`;
    const jpegKey = `${baseKey}.jpg`;

    // Store both small WebP (listing card) and JPEG original-ish
    const jpegBuf = await (async () => {
      if (made.contentType.includes("jpeg") || made.contentType.includes("jpg")) {
        // re-encode to max size for consistency
        const sharp = (await import("sharp")).default;
        return sharp(made.buffer)
          .rotate()
          .resize({ width: width, height: height, fit: "inside" })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      const sharp = (await import("sharp")).default;
      return sharp(made.buffer).jpeg({ quality: 85 }).toBuffer();
    })();

    const [webpUp, jpegUp] = await Promise.all([
      uploadBufferToMinIO(webpKey, webp, "image/webp"),
      uploadBufferToMinIO(jpegKey, jpegBuf, "image/jpeg"),
    ]);

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "store.ai.image",
      cook_id: cookId,
      mode: parse.data.mode,
      source: made.source,
      bytes: webp.length,
    });

    res.status(201).json({
      image_url: webpUp.url || jpegUp.url,
      jpeg_url: jpegUp.url,
      webp_url: webpUp.url,
      key: webpUp.key,
      jpeg_key: jpegUp.key,
      width,
      height,
      bytes: webp.length,
      source: made.source,
      prompt: made.prompt,
      model: made.source.includes("flux") ? CF_MODEL_LABEL : made.source,
      disclaimer: "AI images are illustrative — real dish may vary. Prefer a real kitchen photo when possible.",
    });
  } catch (e: any) {
    const msg = e?.message || "AI image failed";
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.warn?.({ event: "store.ai.image.error", cook_id: cookId, message: msg });
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", msg) });
  }
}

const CF_MODEL_LABEL = "@cf/black-forest-labs/flux-1-schnell";
