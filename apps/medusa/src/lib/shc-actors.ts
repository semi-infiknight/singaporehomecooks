import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { resolveAuthFromRequest, type ShcAuthContext } from "./shc-auth";

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

export function unauthorized(res: MedusaResponse, message: string) {
  return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", message) });
}