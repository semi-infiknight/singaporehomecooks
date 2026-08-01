import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { isCookRegisterOtpReady } from "../../../../../../../lib/shc-cook-whatsapp-verify-session";

/** GET /store/shc/auth/cook/register/whatsapp-verify-status?mobile= — poll after user messages WhatsApp. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mobileRaw = String((req.query as any)?.mobile || "");
  const mobile = normalizePaynowMobile(mobileRaw);
  if (!mobile) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid mobile number") });
  }

  const otp_ready = await isCookRegisterOtpReady(mobileRaw);
  return res.json({ ok: true, otp_ready });
}
