import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { getCookId } from "../../../../../../lib/shc-actors";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const DEMO_OTP = "123456";
const BodySchema = z.object({ mobile: z.string().min(8).max(20) }).strict();

/** POST /store/shc/auth/cook/verify-mobile — send SMS OTP stub. */
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
  return res.json({
    ok: true,
    sent: true,
    hint: `Enter code ${DEMO_OTP} to verify (demo)`,
    mobile_masked: mobile.replace(/(\+65)(\d{4})(\d{4})/, "$1****$3"),
  });
}
