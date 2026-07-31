import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../lib/shc-actors";
import { uploadBufferToMinIO } from "../../../../../lib/minio-client";
import {
  createListingFoodImage,
  getAiImagePublicStatus,
  isCloudflareImageConfigured,
} from "../../../../../lib/shc-cf-image";
import { generateListingDerivatives } from "../../../../../lib/shc-image-derivatives";
import { checkRateLimit, getRateLimitKey, sendRateLimitResponse, setRateLimitHeaders } from "../../../../../lib/shc-rate-limit";

/**
 * POST /store/shc/ai/image
 * Cook-only: generate (FLUX) or enhance (polish = sharp / restyle = FLUX) listing food photo.
 * Returns MinIO URL + small WebP derivative.
 *
 * Body:
 *   mode: "generate" | "enhance"
 *   dish_name: string
 *   cuisine?: string
 *   image_base64?: string     (required for enhance polish)
 *   enhance_style?: "polish" | "restyle"
 *   ai_restyle?: boolean      (legacy: true → restyle; default polish)
 */
const BodySchema = z
  .object({
    mode: z.enum(["generate", "enhance"]),
    dish_name: z.string().min(1).max(120),
    cuisine: z.string().max(60).optional(),
    image_base64: z.string().max(8_000_000).optional(),
    ai_restyle: z.boolean().optional(),
    enhance_style: z.enum(["polish", "restyle"]).optional(),
  })
  .strict();

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json(getAiImagePublicStatus());
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }

  const rate = await checkRateLimit(getRateLimitKey(req, `ai.image.${cookId}`), {
    max: Number(process.env.SHC_AI_IMAGE_PER_COOK_HOUR || 30),
    windowMs: 60 * 60 * 1000,
  });
  setRateLimitHeaders(res, rate);
  if (!rate.allowed) {
    return sendRateLimitResponse(req, res, rate);
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
      image_base64: parse.data.image_base64,
      ai_restyle: parse.data.ai_restyle,
      enhance_style: parse.data.enhance_style,
    });

    const stamp = Date.now();
    const baseKey = `listings/${cookId}/ai-${parse.data.mode}-${stamp}`;
    const jpegKey = `${baseKey}.jpg`;

    const [derivatives, jpegBuf] = await Promise.all([
      generateListingDerivatives(made.buffer, baseKey),
      (async () => {
        const sharp = (await import("sharp")).default;
        return sharp(made.buffer).rotate().jpeg({ quality: 85 }).toBuffer();
      })(),
    ]);

    const jpegUp = await uploadBufferToMinIO(jpegKey, jpegBuf, "image/jpeg");
    const width = derivatives.heroKey ? 640 : 640;
    const height = width;

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "store.ai.image",
      cook_id: cookId,
      mode: parse.data.mode,
      source: made.source,
      enhance_style: made.enhance_style,
      bytes: derivatives.thumb.url ? 1 : 0,
    });

    const isAi = made.source.includes("flux");
    res.status(201).json({
      image_url: derivatives.thumb.url || jpegUp.url,
      jpeg_url: jpegUp.url,
      webp_url: derivatives.thumb.url,
      key: derivatives.thumbKey,
      hero_key: derivatives.heroKey,
      thumb_key: derivatives.thumbKey,
      image_thumb_url: derivatives.thumb.url,
      image_hero_url: derivatives.hero.url,
      jpeg_key: jpegUp.key,
      width,
      height,
      bytes: jpegBuf.length,
      source: made.source,
      enhance_style: made.enhance_style,
      prompt: made.prompt,
      model: isAi ? CF_MODEL_LABEL : made.source,
      disclaimer: isAi
        ? "AI images are illustrative — real dish may vary. Prefer a real kitchen photo when possible."
        : "Photo optimized for listing cards (lighting/contrast). Your original composition is kept.",
    });
  } catch (e: any) {
    const msg = e?.message || "AI image failed";
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.warn?.({ event: "store.ai.image.error", cook_id: cookId, message: msg });
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", msg) });
  }
}

const CF_MODEL_LABEL = "@cf/black-forest-labs/flux-1-schnell";
