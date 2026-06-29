import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcDisputeModuleService from "../../../../modules/shc-dispute/service";

const QuerySchema = z
  .object({
    order_id: z.string().optional(),
    status: z.enum(["open", "resolved", "cancelled", "all"]).default("open"),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const CreateSchema = z
  .object({
    order_id: z.string().min(1),
    raised_by: z.enum(["customer", "cook", "ops"]),
    type: z.enum(["customer_complaint", "cook_cancelled_late", "quality", "other"]),
    notes: z.string().optional(),
  })
  .strict();

/** GET/POST /admin/shc/disputes — manual ops surface for launch disputes. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad dispute query", parse.error.format() as any) });
  }

  const disputeService: ShcDisputeModuleService = req.scope.resolve("shcDispute") as any;
  const filters: Record<string, unknown> = {};
  if (parse.data.order_id) filters.order_id = parse.data.order_id;
  if (parse.data.status !== "all") filters.status = parse.data.status;

  const [disputes, count] = await disputeService.listAndCountDisputes(filters, { take: parse.data.limit });
  res.json({ disputes, count, filters });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid dispute payload", parse.error.format() as any) });
  }

  const disputeService: ShcDisputeModuleService = req.scope.resolve("shcDispute") as any;
  try {
    const [dispute] = await disputeService.createDisputes([{ ...parse.data, status: "open" } as any]);
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.disputes.create", order_id: parse.data.order_id, dispute_id: dispute?.id });
    res.status(201).json({ dispute });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Dispute create failed") });
  }
}
