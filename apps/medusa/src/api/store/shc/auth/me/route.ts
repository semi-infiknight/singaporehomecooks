import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { fetchCustomerProfile, getBearerToken, resolveAuthFromRequest } from "../../../../../lib/shc-auth";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = resolveAuthFromRequest(req);
  if (!auth) {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Not authenticated") });
  }

  if (auth.actor_type === "cook") {
    return res.json({
      user: {
        role: "cook",
        id: auth.actor_id,
        email: auth.email,
        name: auth.name,
      },
    });
  }

  const token = getBearerToken(req);
  const publishableKey = (req.headers["x-publishable-api-key"] as string) || "";
  const baseUrl = process.env.MEDUSA_PUBLIC_URL || `http://localhost:${process.env.PORT || 9000}`;

  if (token && publishableKey) {
    try {
      const profile = await fetchCustomerProfile(baseUrl, token, publishableKey);
      return res.json({
        user: {
          role: "customer",
          id: profile.id,
          email: profile.email,
          name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email,
        },
      });
    } catch {
      /* fall through */
    }
  }

  res.json({
    user: {
      role: "customer",
      id: auth.actor_id,
      email: auth.email,
    },
  });
}