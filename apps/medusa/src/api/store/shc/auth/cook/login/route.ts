import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { authenticateCookWithDb, issueCookToken } from "../../../../../../lib/shc-auth";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";
import { checkRateLimit, getRateLimitKey } from "../../../../../../lib/shc-rate-limit";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const rate = checkRateLimit(getRateLimitKey(req, "auth.cook.login"), { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return res.status(429).json({ error: createSHCError("SHC-GENERIC-001", "Too many login attempts. Try again later.") });
  }

  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid login payload") });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const cook = await authenticateCookWithDb(cookService, parse.data.email, parse.data.password);
  if (!cook) {
    return res.status(401).json({
      error: createSHCError("SHC-GENERIC-001", "Invalid email or password"),
    });
  }

  const token = issueCookToken(cook.email, cook.cook_id, cook.name);
  res.json({
    token,
    user: {
      role: "cook" as const,
      id: cook.cook_id,
      email: cook.email,
      name: cook.name,
    },
  });
}