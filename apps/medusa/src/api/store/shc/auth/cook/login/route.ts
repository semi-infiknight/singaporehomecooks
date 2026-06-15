import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { issueCookToken, verifyCookLogin } from "../../../../../../lib/shc-auth";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid login payload") });
  }

  const cook = verifyCookLogin(parse.data.email, parse.data.password);
  if (!cook) {
    return res.status(401).json({
      error: createSHCError("SHC-GENERIC-001", "Invalid email or password"),
    });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const [rows] = await cookService.listAndCountCooks({ id: cook.cook_id } as any, { take: 1 }).catch(() => [[]]);
  if (!(rows as any[])?.[0]) {
    return res.status(401).json({
      error: createSHCError("SHC-GENERIC-001", "Cook account not found — run medusa seed"),
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