import type { MedusaRequest } from "@medusajs/framework/http";
import { createHmac, timingSafeEqual } from "crypto";
import { verifyCookPassword } from "./shc-password";

export type ShcAuthContext = {
  actor_type: "customer" | "cook";
  actor_id: string;
  email?: string;
  name?: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_for_shc_local_only_change_in_prod";

/** Dev cook credentials — seeded by bootstrap/seed. Replace with hashed DB lookup in production. */
export const DEV_COOK_CREDENTIALS: Record<string, { password: string; cook_id: string; name: string }> = {
  "rose@shc.local": { password: "cooksecret", cook_id: "cook_rose_tampines_001", name: "Auntie Rose (Tampines)" },
  "doris@shc.local": { password: "cooksecret", cook_id: "cook_doris_katong_002", name: "Auntie Doris (Katong)" },
};

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signShcToken(payload: Record<string, unknown>, expiresInSec = 60 * 60 * 24 * 30) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    })
  );
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest();
  return `${header}.${body}.${b64url(sig)}`;
}

export function verifyShcToken(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest();
  const actual = b64urlDecode(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueCookToken(email: string, cookId: string, name: string) {
  return signShcToken({ actor_type: "cook", actor_id: cookId, email, name, shc: true });
}

/** Dev-only plaintext fallback — disable in prod via SHC_COOK_ALLOW_DEV_PLAINTEXT=false */
export function verifyCookLoginDevFallback(email: string, password: string) {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.SHC_COOK_ALLOW_DEV_PLAINTEXT === "false") return null;
  const cred = DEV_COOK_CREDENTIALS[email.toLowerCase().trim()];
  if (!cred || cred.password !== password) return null;
  return { cook_id: cred.cook_id, email: email.toLowerCase().trim(), name: cred.name };
}

/** Resolve cook from DB by login_email after password check (auth_identity_id is source of truth). */
export async function authenticateCookWithDb(
  cookService: { findByLoginEmail: (email: string) => Promise<any>; listAndCountCooks?: (f: any, o?: any) => Promise<any[]> },
  email: string,
  password: string
) {
  const normalized = email.toLowerCase().trim();
  const byEmail = await cookService.findByLoginEmail(normalized);

  if (byEmail?.password_hash) {
    if (!verifyCookPassword(password, byEmail.password_hash)) return null;
    return {
      cook_id: byEmail.id,
      email: normalized,
      name: byEmail.display_name,
      auth_identity_id: byEmail.auth_identity_id,
    };
  }

  const cred = verifyCookLoginDevFallback(normalized, password);
  if (!cred) return null;

  if (byEmail) {
    return {
      cook_id: byEmail.id,
      email: normalized,
      name: byEmail.display_name || cred.name,
      auth_identity_id: byEmail.auth_identity_id,
    };
  }

  if (cookService.listAndCountCooks) {
    const [rows] = await cookService.listAndCountCooks({ id: cred.cook_id } as any, { take: 1 }).catch(() => [[]]);
    const row = (rows as any[])?.[0];
    if (row) {
      return {
        cook_id: row.id,
        email: normalized,
        name: row.display_name || cred.name,
        auth_identity_id: row.auth_identity_id,
      };
    }
  }

  return cred;
}

export function getBearerToken(req: MedusaRequest): string | null {
  const h = req.headers.authorization || (req.headers as any).Authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export function resolveAuthFromRequest(req: MedusaRequest): ShcAuthContext | null {
  const token = getBearerToken(req);
  if (!token) return null;

  const shc = verifyShcToken(token);
  if (shc?.shc && shc.actor_type === "cook" && typeof shc.actor_id === "string") {
    return {
      actor_type: "cook",
      actor_id: shc.actor_id,
      email: typeof shc.email === "string" ? shc.email : undefined,
      name: typeof shc.name === "string" ? shc.name : undefined,
    };
  }

  // Medusa-issued customer JWT (decode payload; same secret in local dev)
  const medusa = verifyShcToken(token);
  if (medusa && typeof medusa.actor_id === "string") {
    const t = medusa.actor_type;
    if (t === "customer") {
      return {
        actor_type: "customer",
        actor_id: medusa.actor_id,
        email: typeof medusa.email === "string" ? medusa.email : undefined,
      };
    }
  }

  // Medusa customer tokens use app_metadata / actor_id in payload
  const parts = token.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(b64urlDecode(parts[1]).toString("utf8"));
      const actorId = payload.actor_id || payload.sub || payload.id;
      const actorType = payload.actor_type || "customer";
      if (actorId && actorType === "customer") {
        return { actor_type: "customer", actor_id: String(actorId), email: payload.email };
      }
      if (actorId && (actorType === "cook" || payload.app_metadata?.cook_id)) {
        return {
          actor_type: "cook",
          actor_id: String(payload.app_metadata?.cook_id || actorId),
          email: payload.email,
        };
      }
    } catch {
      /* fall through */
    }
  }

  return null;
}

export async function medusaCustomerLogin(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as any)?.message || `Customer login failed (${res.status})`);
  }
  return body as { token: string };
}

export async function medusaCustomerRegister(baseUrl: string, email: string, password: string) {
  const res = await fetch(`${baseUrl}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as any)?.message || `Customer registration failed (${res.status})`);
  }
  return body as { token: string };
}

export async function ensureStoreCustomer(
  baseUrl: string,
  token: string,
  publishableKey: string,
  profile: { email: string; first_name?: string; last_name?: string }
) {
  try {
    return await fetchCustomerProfile(baseUrl, token, publishableKey);
  } catch {
    /* auth exists but store customer row may be missing */
  }
  if (!publishableKey) {
    return { id: profile.email, email: profile.email, first_name: profile.first_name, last_name: profile.last_name };
  }
  const res = await fetch(`${baseUrl}/store/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-publishable-api-key": publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: profile.email,
      first_name: profile.first_name || "Customer",
      last_name: profile.last_name || "",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    try {
      return await fetchCustomerProfile(baseUrl, token, publishableKey);
    } catch {
      throw new Error((body as any)?.message || `Failed to create store customer (${res.status})`);
    }
  }
  const customer = (body as any).customer || body;
  return {
    id: customer.id as string,
    email: customer.email as string,
    first_name: customer.first_name as string | undefined,
    last_name: customer.last_name as string | undefined,
  };
}

export async function fetchCustomerProfile(baseUrl: string, token: string, publishableKey: string) {
  const res = await fetch(`${baseUrl}/store/customers/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-publishable-api-key": publishableKey,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as any)?.message || `Failed to load customer profile (${res.status})`);
  }
  const customer = (body as any).customer || body;
  return {
    id: customer.id as string,
    email: customer.email as string,
    first_name: customer.first_name as string | undefined,
    last_name: customer.last_name as string | undefined,
  };
}