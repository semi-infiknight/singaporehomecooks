import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId } from "../../../../../../lib/shc-actors";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const DEMO_OTP = "123456";
const BodySchema = z.object({ code: z.string().min(4).max(8) }).strict();

/** POST /store/shc/auth/cook/confirm-email — confirm email OTP (MVP stub). */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid code") });
  }
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  if (parse.data.code.trim() !== DEMO_OTP) {
    return res.status(400).json({ error: createSHCError("SHC-AUTH-001", "Invalid verification code") });
  }
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  await cookService.updateCooks({
    selector: { id: cookId },
    data: { email_verified_at: new Date(), updated_at: new Date() } as any,
  });
  return res.json({ ok: true, email_verified: true });
}
