import type { MedusaRequest } from "@medusajs/framework/http";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Normalize header value to bare UUID (no guest_ prefix). */
export function normalizeGuestId(raw: string | null | undefined): string | null {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  const bare = trimmed.startsWith("guest_") ? trimmed.slice(6) : trimmed;
  return UUID_RE.test(bare) ? bare : null;
}

export function toGuestCartActorId(guestUuid: string): string {
  const bare = normalizeGuestId(guestUuid);
  if (!bare) throw new Error("INVALID_GUEST_ID");
  return `guest_${bare}`;
}

export function isGuestCartActorId(actorId: string | null | undefined): boolean {
  return String(actorId || "").startsWith("guest_");
}

/** Read `x-shc-guest-id` and return cart actor id `guest_<uuid>`. */
export function resolveGuestCartActorId(req: MedusaRequest): string | null {
  const header = req.headers["x-shc-guest-id"];
  const raw = Array.isArray(header) ? header[0] : header;
  const bare = normalizeGuestId(raw);
  if (!bare) return null;
  return toGuestCartActorId(bare);
}
