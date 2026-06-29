import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcDisputeModuleService from "../../../../../modules/shc-dispute/service";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";

const UpdateSchema = z
  .object({
    status: z.enum(["open", "resolved", "cancelled"]).optional(),
    notes: z.string().optional(),
    resolution: z.string().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field required" });

/** POST /admin/shc/disputes/:id — update status/resolution. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = UpdateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid dispute update", parse.error.format() as any) });
  }

  const disputeService: ShcDisputeModuleService = req.scope.resolve("shcDispute") as any;
  try {
    const [dispute] = await disputeService.updateDisputes({
      selector: { id },
      data: parse.data as any,
    });
    if (parse.data.status === "resolved" && dispute?.order_id) {
      const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
      await metaService.createOrUpdateMeta({
        order_id: dispute.order_id,
        shc_status: "resolved",
      } as any);
    }
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.disputes.update", dispute_id: id, status: parse.data.status });
    res.json({ dispute });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Dispute update failed") });
  }
}
