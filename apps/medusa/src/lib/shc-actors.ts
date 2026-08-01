import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { resolveAuthFromRequest, type ShcAuthContext } from "./shc-auth";
import { resolveGuestCartActorId } from "./shc-guest";

export function getAuthContext(req: MedusaRequest): ShcAuthContext | null {
  const auth = resolveAuthFromRequest(req);
  if (auth) (req as any).auth = { actor_type: auth.actor_type, actor_id: auth.actor_id };
  return auth;
}

export function requireCustomerId(req: MedusaRequest): string | null {
  const auth = getAuthContext(req);
  return auth?.actor_type === "customer" ? auth.actor_id : null;
}

export function requireCookId(req: MedusaRequest): string | null {
  const auth = getAuthContext(req);
  return auth?.actor_type === "cook" ? auth.actor_id : null;
}

export function getCustomerId(req: MedusaRequest): string {
  const id = requireCustomerId(req);
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

export function getCookId(req: MedusaRequest): string {
  const id = requireCookId(req);
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

export function tryCustomerId(req: MedusaRequest): string | null {
  try {
    return getCustomerId(req);
  } catch {
    return null;
  }
}

export function tryCookId(req: MedusaRequest): string | null {
  try {
    return getCookId(req);
  } catch {
    return null;
  }
}

/** Customer JWT id, or `guest_<uuid>` from `x-shc-guest-id` for device-local guest carts. */
export function getCartActorId(req: MedusaRequest): string {
  const customer = tryCustomerId(req);
  if (customer) return customer;
  const guest = resolveGuestCartActorId(req);
  if (guest) return guest;
  throw new Error("UNAUTHORIZED");
}

export function tryCartActorId(req: MedusaRequest): string | null {
  try {
    return getCartActorId(req);
  } catch {
    return null;
  }
}

export function unauthorized(res: MedusaResponse, message: string) {
  return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", message) });
}

/**
 * Map route catch → 401 only for real auth failures; surface business/DB errors correctly.
 * (Previously any non-code throw was mislabeled "Customer login required".)
 */
export function tiffinCustomerError(res: MedusaResponse, e: any, fallback = "Tiffin request failed") {
  const msg = String(e?.message || "");
  if (msg === "UNAUTHORIZED" || msg === "Customer login required" || msg === "Cook login required") {
    return unauthorized(res, msg === "Cook login required" ? "Cook login required" : "Customer login required");
  }
  if (e?.code && e?.message) {
    return res.status(400).json({ error: { code: e.code, message: e.message, details: e.details } });
  }
  return res.status(500).json({
    error: createSHCError("SHC-GENERIC-001", msg || fallback),
  });
}