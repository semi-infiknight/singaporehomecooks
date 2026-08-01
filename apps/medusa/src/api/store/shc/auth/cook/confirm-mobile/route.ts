import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { getCookId } from "../../../../../../lib/shc-actors";
import {
  clearCookWhatsappOtp,
  verifyCookWhatsappOtp,
} from "../../../../../../lib/shc-cook-whatsapp-otp";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z
  .object({
    code: z.string().min(4).max(8),
    mobile: z.string().min(8).max(20).optional(),
  })
  .strict();

/** POST /store/shc/auth/cook/confirm-mobile — confirm WhatsApp OTP from onboarding. */
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

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (rows as any[])?.[0];
  const mobile =
    normalizePaynowMobile(parse.data.mobile) || normalizePaynowMobile(cook?.contact_mobile);
  if (!mobile) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Mobile number required") });
  }

  const ok = await verifyCookWhatsappOtp("mobile_verify", mobile, parse.data.code.trim(), cookId);
  if (!ok) {
    return res.status(400).json({ error: createSHCError("SHC-AUTH-001", "Invalid verification code") });
  }

  await cookService.updateCooks({
    selector: { id: cookId },
    data: {
      contact_mobile: mobile,
      whatsapp_number: mobile,
      mobile_verified_at: new Date(),
      updated_at: new Date(),
    } as any,
  });
  await clearCookWhatsappOtp("mobile_verify", mobile, cookId);
  return res.json({ ok: true, mobile_verified: true });
}
