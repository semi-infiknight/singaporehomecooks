import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { getCookId } from "../../../../../../lib/shc-actors";
import { issueCookWhatsappOtp } from "../../../../../../lib/shc-cook-whatsapp-otp";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z.object({ mobile: z.string().min(8).max(20) }).strict();

/** POST /store/shc/auth/cook/verify-mobile — send WhatsApp OTP for onboarding mobile verify. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid mobile") });
  }
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  const mobile = normalizePaynowMobile(parse.data.mobile);
  if (!mobile) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid Singapore mobile") });
  }
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  await cookService.updateCooks({
    selector: { id: cookId },
    data: { contact_mobile: mobile, updated_at: new Date() } as any,
  });
  try {
    const { hint, delivered, channel, mobile_masked } = await issueCookWhatsappOtp("mobile_verify", mobile, cookId);
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
