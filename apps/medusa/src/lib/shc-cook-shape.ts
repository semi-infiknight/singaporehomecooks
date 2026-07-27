import { getPresignedGetUrl, SHC_BUCKET } from "./minio-client";

export type CookMediaRow = {
  id?: string;
  slug?: string;
  display_name?: string;
  story?: string | null;
  area?: string;
  status?: string;
  availability_paused?: boolean;
  collection_address?: string | null;
  collection_instructions?: string | null;
  collection_time_slots?: string[];
  avatar_url?: string | null;
  hero_image_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
};

function isAbsoluteMediaUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  );
}

function buildPublicMinioUrl(key: string): string | undefined {
  const publicBase = (process.env.MINIO_PUBLIC_URL || process.env.MINIO_PUBLIC_ENDPOINT || "").trim();
  if (!publicBase) return undefined;
  try {
    const base = publicBase.includes("://") ? publicBase : `https://${publicBase}`;
    const u = new URL(base);
    const path = `${u.pathname.replace(/\/$/, "")}/${SHC_BUCKET}/${key}`.replace(/\/{2,}/g, "/");
    return `${u.origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return undefined;
  }
}

/** Resolve stored cook media key or URL for client display. */
export async function resolveCookMediaUrl(stored?: string | null): Promise<string | undefined> {
  const value = String(stored || "").trim();
  if (!value || value === "null" || value === "undefined") return undefined;
  if (isAbsoluteMediaUrl(value)) return value;
  const publicUrl = buildPublicMinioUrl(value);
  if (publicUrl) return publicUrl;
  try {
    return await getPresignedGetUrl(value, 3600 * 24);
  } catch {
    return undefined;
  }
}

export function assertCookOwnsMediaKey(cookId: string, value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return;
  if (isAbsoluteMediaUrl(trimmed)) return;
  const prefix = `cooks/${cookId}/`;
  if (!trimmed.startsWith(prefix)) {
    throw new Error(`Media key must start with ${prefix}`);
  }
}

export async function shapeCookForStore(cook: CookMediaRow) {
  const [avatar_url, hero_image_url] = await Promise.all([
    resolveCookMediaUrl(cook.avatar_url),
    resolveCookMediaUrl(cook.hero_image_url),
  ]);

  return {
    id: cook.id,
    slug: cook.slug,
    display_name: cook.display_name,
    story: cook.story,
    area: cook.area,
    status: cook.status,
    availability_paused: !!cook.availability_paused,
    collection_address: cook.collection_address,
    collection_instructions: cook.collection_instructions,
    collection_time_slots: Array.isArray(cook.collection_time_slots) ? cook.collection_time_slots : [],
    avatar_url,
    hero_image_url,
    rating: cook.rating ?? null,
    review_count: cook.review_count ?? 0,
  };
}
