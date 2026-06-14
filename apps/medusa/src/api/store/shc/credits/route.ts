import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCreditWalletModuleService from "../../../../modules/shc-credit-wallet/service";

/**
 * GET /store/shc/credits?customer_id=...
 * Get balance + tier + history stub (uses credit-wallet + ledger for money).
 * POST /store/shc/credits/redeem
 * Redeem credits (applies to future checkout). Posts ledger redemption for audit (per task 4/2).
 * Full Zod, SHCError, audit logs (actor/before/after), health ready.
 */
const QuerySchema = z.object({
  customer_id: z.string().optional(),
}).strict();

const RedeemSchema = z.object({
  amount: z.number().int().positive(),
  customer_id: z.string().optional(), // in prod from auth
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad credits query", parse.error.format() as any) });
  }
  const credService: ShcCreditWalletModuleService = req.scope.resolve("shcCreditWalletService") as any;
  const customerId = parse.data.customer_id || (req as any).auth?.actor_id || "cust_demo";
  try {
    const balance = await credService.getBalance(customerId);
    const history = await credService.getHistory(customerId, req.scope).catch(() => []);
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.credits.get", customer_id: customerId });
    res.json({ ...balance, history, note: "Balance in units (4 units ~ S$1). See ledger for full redemption/issuance entries." });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Get credits failed") });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Redeem path: /store/shc/credits/redeem (or body action, but use path for simple)
  // For simplicity this POST handles redeem if body has amount (real would route /redeem)
  const parse = RedeemSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid redeem payload", parse.error.format() as any) });
  }
  const credService: ShcCreditWalletModuleService = req.scope.resolve("shcCreditWalletService") as any;
  const actor = (req as any).auth?.actor_id || parse.data.customer_id || "cust_demo";
  try {
    const before = await credService.getBalance(actor);
    const result = await credService.redeemCredits(actor, parse.data.amount, req.scope);
    const logger = (req.scope as any).resolve?.("logger") || console;
    const audit = {
      ts: new Date().toISOString(),
      actor,
      action: "credits.redeem",
      before,
      after: { ...result },
      meta: { ledger_posted: result.ledgerPosted },
    };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Redeem failed") });
  }
}
