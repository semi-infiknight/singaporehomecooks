import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError, shcComplianceDocSchema } from "@shc/types";
import { getCookId } from "../../../../lib/shc-actors";
import ShcComplianceDocModuleService from "../../../../modules/shc-compliance-doc/service";

const BodySchema = z.object({
  type: z.enum(["sfa", "wsq"]),
  file_key: z.string().min(3),
  expiry_date: z.string().datetime().optional(),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const complianceService: ShcComplianceDocModuleService = req.scope.resolve("shcComplianceDoc") as any;
  const [docs] = await complianceService.listAndCountComplianceDocs({ cook_id: cookId } as any, {
    take: 50,
    order: { created_at: "DESC" },
  }).catch(() => [[]]);

  res.json({ docs: docs || [] });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid compliance document", parse.error.format() as any) });
  }

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const complianceService: ShcComplianceDocModuleService = req.scope.resolve("shcComplianceDoc") as any;
  const payload = shcComplianceDocSchema.parse({
    id: `comp_${cookId}_${parse.data.type}_${Date.now()}`,
    cook_id: cookId,
    type: parse.data.type,
    file_key: parse.data.file_key,
    expiry_date: parse.data.expiry_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [doc] = await complianceService.createComplianceDocs([payload as any]);
  const logger = (req.scope as any).resolve?.("logger") ?? console;
  logger.info?.({ event: "compliance.doc.submitted", cook_id: cookId, type: payload.type, file_key: payload.file_key });

  res.status(201).json({ doc });
}
