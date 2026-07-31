import sharp from "sharp";
import { getPresignedGetUrl, getObjectBuffer, uploadBufferToMinIO } from "./minio-client";

export type ListingDerivativeKeys = {
  baseKey: string;
  heroKey: string;
  thumbKey: string;
};

export type ListingDerivativeUrls = ListingDerivativeKeys & {
  image_url: string | null;
  image_thumb_url: string | null;
  image_hero_url: string | null;
};

const HERO_WIDTH = 1200;
const THUMB_WIDTH = 400;

/** Derive MinIO keys for hero + thumb WebP from an object key or URL. */
export function listingDerivativeKeys(baseKey: string): ListingDerivativeKeys {
  const normalized = stripQuery(baseKey);
  const withoutExt = normalized.replace(/\.[^.]+$/, "").replace(/-400$/, "").replace(/-1200$/, "");
  return {
    baseKey: withoutExt,
    heroKey: `${withoutExt}-1200.webp`,
    thumbKey: `${withoutExt}-400.webp`,
  };
}

function stripQuery(value: string) {
  return value.split("?")[0] || value;
}

function keyFromUrlOrKey(imageRef: string): string | null {
  const trimmed = imageRef.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return stripQuery(trimmed);
  try {
    const u = new URL(trimmed);
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    const bucket = process.env.MINIO_BUCKET || "shc-images";
    if (path.startsWith(`${bucket}/`)) return path.slice(bucket.length + 1);
    const parts = path.split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : parts[0] || null;
  } catch {
    return null;
  }
}

/** Generate 1200px hero + 400px thumb WebP derivatives and upload to MinIO. */
export async function generateListingDerivatives(
  source: Buffer,
  baseKey: string
): Promise<ListingDerivativeKeys & { hero: { key: string; url?: string }; thumb: { key: string; url?: string } }> {
  const keys = listingDerivativeKeys(baseKey);
  const [heroBuf, thumbBuf] = await Promise.all([
    sharp(source)
      .rotate()
      .resize({ width: HERO_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer(),
    sharp(source)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer(),
  ]);

  const [hero, thumb] = await Promise.all([
    uploadBufferToMinIO(keys.heroKey, heroBuf, "image/webp"),
    uploadBufferToMinIO(keys.thumbKey, thumbBuf, "image/webp"),
  ]);

  return { ...keys, hero, thumb };
}

/** Resolve stored image ref (key or legacy URL) to signed hero/thumb URLs for clients. */
export async function resolveListingImageUrls(imageRef?: string | null): Promise<ListingDerivativeUrls | null> {
  if (!imageRef?.trim()) return null;
  const baseKey = keyFromUrlOrKey(imageRef);
  if (!baseKey) {
    return {
      baseKey: imageRef,
      heroKey: imageRef,
      thumbKey: imageRef,
      image_url: imageRef,
      image_thumb_url: imageRef,
      image_hero_url: imageRef,
    };
  }

  const keys = listingDerivativeKeys(baseKey);
  try {
    const [thumbUrl, heroUrl] = await Promise.all([
      getPresignedGetUrl(keys.thumbKey).catch(() => null),
      getPresignedGetUrl(keys.heroKey).catch(() => null),
    ]);
    const fallback = /^https?:\/\//i.test(imageRef) ? imageRef : await getPresignedGetUrl(baseKey).catch(() => null);
    return {
      ...keys,
      image_url: thumbUrl || fallback,
      image_thumb_url: thumbUrl || fallback,
      image_hero_url: heroUrl || thumbUrl || fallback,
    };
  } catch {
    const fallback = /^https?:\/\//i.test(imageRef) ? imageRef : null;
    return {
      ...keys,
      image_url: fallback,
      image_thumb_url: fallback,
      image_hero_url: fallback,
    };
  }
}

/** Download an uploaded object from MinIO and produce derivatives (presigned flow finalize). */
export async function finalizeUploadedListingImage(objectName: string) {
  const buffer = await getObjectBuffer(objectName);
  const derivatives = await generateListingDerivatives(buffer, objectName);
  return {
    base_key: derivatives.baseKey,
    hero_key: derivatives.heroKey,
    thumb_key: derivatives.thumbKey,
    image_url: derivatives.thumb.url,
    image_thumb_url: derivatives.thumb.url,
    image_hero_url: derivatives.hero.url,
    webp_key: derivatives.thumbKey,
    webp_url: derivatives.thumb.url,
  };
}
