import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { prepareCookRegisterWhatsappVerify } from "../../../../../../../lib/shc-cook-whatsapp-verify-session";
import ShcCookModuleService from "../../../../../../../modules/shc-cook/service";

const BodySchema = z.object({ mobile: z.string().min(8).max(20) }).strict();

/** POST /store/shc/auth/cook/register/send-whatsapp-otp — returns wa.me link; OTP sent after user messages us. */
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
    const prepared = await prepareCookRegisterWhatsappVerify(parse.data.mobile);
    return res.json({
      ok: true,
      sent: false,
      delivered: false,
      channel: prepared.demo_code ? "demo" : "whatsapp_session",
      verify_token: prepared.verify_token,
      whatsapp_url: prepared.whatsapp_url,
      prefill_message: prepared.prefill_message,
      otp_ready: prepared.otp_ready,
      hint: prepared.hint,
      mobile_masked: prepared.mobile_masked,
      ...(prepared.demo_code ? { demo_code: prepared.demo_code } : {}),
    });
  } catch (e) {
    return res.status(503).json({
      error: createSHCError("SHC-GENERIC-001", (e as Error).message || "Could not start WhatsApp verification"),
    });
  }
}
