import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcComplianceDocModuleService from "../../../../../../modules/shc-compliance-doc/service";
import { buildCompliancePreviewUrl } from "../../../../../../lib/shc-compliance-preview";

/** GET /admin/shc/compliance/:id/preview-url — short-lived signed MinIO link for ops review */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const complianceService: ShcComplianceDocModuleService = req.scope.resolve("shcComplianceDoc") as any;
  const [existing] = await complianceService.listAndCountComplianceDocs({ id } as any, { take: 1 }).catch(() => [[]]);
  const doc = (existing as any[])?.[0];
  if (!doc?.file_key) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Compliance doc not found: ${id}`) });
  }

  try {
    const preview = await buildCompliancePreviewUrl(String(doc.file_key));
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({
      event: "admin.compliance.preview_url",
      doc_id: id,
      cook_id: doc.cook_id,
      type: doc.type,
      bucket: preview.bucket,
    });
    res.json({
      doc_id: id,
      file_key: doc.file_key,
      ...preview,
    });
  } catch (e: any) {
    res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e.message || "Could not generate compliance preview URL"),
    });
  }
}
