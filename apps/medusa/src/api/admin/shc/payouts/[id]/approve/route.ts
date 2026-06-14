import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcPayoutBatchModuleService from "../../../../../../modules/shc-payout-batch/service";
import ShcLedgerModuleService from "../../../../../../modules/shc-ledger/service";

/**
 * POST /admin/shc/payouts/:id/approve
 * Ops approves batch (sets approved + sim transfer_ref). Production: check compliance, trigger actual payout provider.
 * Hardened: Zod, SHC-PAYOUT-001 on bad status, audit log with actor.
 */
const BodySchema = z.object({
  actor: z.string().optional().default("ops"),
  notes: z.string().optional(),
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: batchId } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid approve payload", parse.error.format() as any) });
  }
  const { actor } = parse.data;

  const payoutService: ShcPayoutBatchModuleService = req.scope.resolve("shcPayoutBatchService") as any;

  try {
    const approved = await payoutService.approvePayoutBatch(batchId, actor, req.scope);

    // Optional: after approve could mark paid or trigger transfer sim here. Script does auto for demo.

    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({
      event: "admin.payout.approve",
      batch_id: batchId,
      actor,
      transfer_ref: (approved as any).transfer_ref,
    });

    res.json({ success: true, batch: approved, note: "Batch approved. transfer_ref simulated. For full payout confirm use markPaid or real provider." });
  } catch (e: any) {
    const code = e.code || "SHC-PAYOUT-001";
    res.status(400).json({ error: createSHCError(code as any, e.message || "Approve failed") });
  }
}
