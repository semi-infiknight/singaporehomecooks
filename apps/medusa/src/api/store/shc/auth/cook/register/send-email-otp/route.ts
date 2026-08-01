import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { issueCookRegisterEmailOtp } from "../../../../../../../lib/shc-cook-register-otp";
import ShcCookModuleService from "../../../../../../../modules/shc-cook/service";

const BodySchema = z.object({ email: z.string().email() }).strict();

/** POST /store/shc/auth/cook/register/send-email-otp — send OTP before account creation. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid email") });
  }

  const email = parse.data.email.toLowerCase().trim();
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const existing = await cookService.findByLoginEmail(email);
  if (existing) {
    return res.status(409).json({
      error: createSHCError("SHC-GENERIC-001", "A cook account with this email already exists"),
    });
  }

  const { hint } = await issueCookRegisterEmailOtp(email);
  return res.json({
    ok: true,
    sent: true,
    hint,
    email_masked: email.replace(/(.{2}).+(@.+)/, "$1***$2"),
  });
}
