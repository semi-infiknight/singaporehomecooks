import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { getCookId } from "../../../../../../lib/shc-actors";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const DEMO_OTP = "123456";

/** POST /store/shc/auth/cook/verify-email — send demo verification (MVP stub). */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (rows as any[])?.[0];
  if (!cook?.login_email) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "No email on cook account") });
  }
  return res.json({
    ok: true,
    sent: true,
    hint: `Enter code ${DEMO_OTP} to verify (demo)`,
    email_masked: String(cook.login_email).replace(/(.{2}).+(@.+)/, "$1***$2"),
  });
}
