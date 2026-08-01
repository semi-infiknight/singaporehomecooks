import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { issueCookWhatsappOtp } from "../../../../../../../lib/shc-cook-whatsapp-otp";
import ShcCookModuleService from "../../../../../../../modules/shc-cook/service";

const BodySchema = z.object({ mobile: z.string().min(8).max(20) }).strict();

/** POST /store/shc/auth/cook/register/send-whatsapp-otp — WhatsApp OTP before account creation. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid mobile number") });
  }

  const mobile = normalizePaynowMobile(parse.data.mobile);
  if (!mobile) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Enter a valid Singapore mobile number") });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const existing = await cookService.findByContactMobile(mobile);
  if (existing) {
    return res.status(409).json({
      error: createSHCError("SHC-GENERIC-001", "A cook account with this mobile number already exists"),
    });
  }

  try {
    const { hint, delivered, channel, mobile_masked } = await issueCookWhatsappOtp("register", mobile);
    return res.json({
      ok: true,
      sent: true,
      delivered,
      channel,
      hint,
      mobile_masked,
    });
  } catch (e) {
    return res.status(503).json({
      error: createSHCError("SHC-GENERIC-001", (e as Error).message || "Could not send WhatsApp code"),
    });
  }
}
