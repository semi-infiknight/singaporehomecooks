import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcPayoutBatchModuleService from "../../../../modules/shc-payout-batch/service";
import ShcLedgerModuleService from "../../../../modules/shc-ledger/service";

/**
 * Admin payouts routes (Phase 6).
 * GET /admin/shc/payouts?status=pending  -> list batches
 * POST /admin/shc/payouts -> {week_start?} create/get weekly batch (or trigger sim)
 * All use Zod + SHCErrorCode, audit structured logs.
 * Approve is at /admin/shc/payouts/[id]/approve
 */
const QuerySchema = z.object({
  status: z.enum(["pending", "approved", "paid", "all"]).optional().default("all"),
  week_start: z.string().optional(),
  limit: z.coerce.number().default(20),
}).strict();

const CreateSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // In prod trigger full workflow; here create empty or from current unbatched
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any) });
  }
  const { status, week_start, limit } = parse.data;

  const payoutService: ShcPayoutBatchModuleService = req.scope.resolve("shcPayoutBatchService") as any;
  const where: any = {};
  if (status !== "all") where.status = status;
  if (week_start) where.week_start = week_start;

  const batches = await payoutService.listPayoutBatches({ ...where, limit });

  // Audit
  const logger = (req.scope as any).resolve?.("logger") || console;
  (logger as any).info?.({ event: "admin.payouts.list", actor: "admin", count: batches.length });

  res.json({ batches, count: batches.length });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid create payload", parse.error.format() as any) });
  }
  const { week_start } = parse.data;

  const payoutService: ShcPayoutBatchModuleService = req.scope.resolve("shcPayoutBatchService") as any;
  const ledgerService: ShcLedgerModuleService = req.scope.resolve("shcLedgerService") as any;

  const ws = week_start || new Date().toISOString().slice(0, 10); // caller should use monday; sim accepts

  try {
    const batch = await payoutService.createOrGetWeeklyBatch(ws, 0, req.scope);

    // Optional: in real here could run weeklyPayout logic to populate from completed.
    // For now return batch; use the standalone script for full populating sim.

    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "admin.payouts.create", actor: "admin", week_start: ws, batch_id: (batch as any).id });

    res.json({ batch, note: "Batch created/returned. Use weekly-payout.ts script or /approve after populating ledgers for full flow." });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-PAYOUT-001", e.message || "Create batch failed") });
  }
}
