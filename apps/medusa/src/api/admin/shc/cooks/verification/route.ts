import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import ShcCookModuleService from "../../../../../modules/shc-cook/service";
import { createSHCError } from "@shc/types";

/**
 * GET /admin/shc/cooks/verification?status=pending
 * List cooks needing verification (SFA/WSQ). Ops uses for manual review.
 */
const QuerySchema = z.object({
  status: z.enum(["pending", "active", "all"]).default("pending"),
  limit: z.coerce.number().default(50),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad filters") });
  }
  const { status, limit } = parse.data;

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const where: any = status !== "all" ? { status } : {};
  const [cooks] = await cookService.listAndCountCooks(where, { take: limit });

  res.json({
    cooks: cooks.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      display_name: c.display_name,
      area: c.area,
      status: c.status,
      sfa_reg_number: c.sfa_reg_number,
      wsq_cert_expiry: c.wsq_cert_expiry,
      // compliance docs would be joined from shc_compliance_doc in full
      requires_verification: !c.sfa_reg_number || !c.wsq_cert_expiry,
    })),
  });
}
