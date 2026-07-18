import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcComplianceDocModuleService from "../../../../../../modules/shc-compliance-doc/service";

const BodySchema = z
  .object({
    verified: z.boolean().default(true),
    expiry_date: z.string().datetime().optional(),
  })
  .strict();

/** PATCH /admin/shc/compliance/:id/verify — ops sets verified_at on SFA/WSQ upload */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid verify payload", parse.error.format() as any) });
  }

  const complianceService: ShcComplianceDocModuleService = req.scope.resolve("shcComplianceDoc") as any;
  const [existing] = await complianceService.listAndCountComplianceDocs({ id } as any, { take: 1 }).catch(() => [[]]);
  const doc = (existing as any[])?.[0];
  if (!doc) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Compliance doc not found: ${id}`) });
  }

  const verified = parse.data.verified;
  const data: Record<string, unknown> = {
    verified_at: verified ? new Date() : null,
    updated_at: new Date(),
  };
  if (parse.data.expiry_date) {
    data.expiry_date = new Date(parse.data.expiry_date);
  }

  const [updated] = await complianceService.updateComplianceDocs({
    selector: { id },
    data: data as any,
  });

  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({
    event: "admin.compliance.verify",
    doc_id: id,
    cook_id: doc.cook_id,
    type: doc.type,
    verified,
  });

  res.json({ doc: updated || { ...doc, ...data } });
}
