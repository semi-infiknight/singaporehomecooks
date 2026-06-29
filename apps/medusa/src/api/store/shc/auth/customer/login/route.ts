import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { ensureStoreCustomer, medusaCustomerLogin } from "../../../../../../lib/shc-auth";
import { checkRateLimit, getRateLimitKey } from "../../../../../../lib/shc-rate-limit";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rate = checkRateLimit(getRateLimitKey(req, "auth.customer.login"), { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: createSHCError("SHC-GENERIC-001", "Too many login attempts. Try again later.") });
  }

  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid login payload") });
  }

  const baseUrl = process.env.MEDUSA_PUBLIC_URL || `http://localhost:${process.env.PORT || 9000}`;
  const publishableKey = (req.headers["x-publishable-api-key"] as string) || "";

  try {
    const { token } = await medusaCustomerLogin(baseUrl, parse.data.email, parse.data.password);
    const profile = publishableKey
      ? await ensureStoreCustomer(baseUrl, token, publishableKey, { email: parse.data.email })
      : { id: parse.data.email, email: parse.data.email, first_name: "", last_name: "" };
    res.json({
      token,
      user: {
        role: "customer" as const,
        id: profile.id,
        email: profile.email,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email,
      },
    });
  } catch (e) {
    return res.status(401).json({
      error: createSHCError("SHC-GENERIC-001", (e as Error).message || "Invalid email or password"),
    });
  }
}