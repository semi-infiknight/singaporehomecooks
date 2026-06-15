import { MedusaRequest } from "@medusajs/framework/http";
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