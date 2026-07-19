import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcComplianceDocModuleService from "../../../../modules/shc-compliance-doc/service";
import ShcCookModuleService from "../../../../modules/shc-cook/service";

const QuerySchema = z
  .object({
    status: z.enum(["pending", "verified", "all"]).default("pending"),
    cook_id: z.string().optional(),
    limit: z.coerce.number().int().positive().max(200).default(100),
  })
  .strict();

/** GET /admin/shc/compliance — ops queue for SFA/WSQ document review */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Bad compliance query", parse.error.format() as any) });
  }

  const { status, cook_id, limit } = parse.data;
  const complianceService: ShcComplianceDocModuleService = req.scope.resolve("shcComplianceDoc") as any;
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;

  const where: Record<string, unknown> = {};
  if (cook_id) where.cook_id = cook_id;

  const [rawDocs] = await complianceService
    .listAndCountComplianceDocs(where as any, { take: limit, order: { created_at: "DESC" } })
    .catch(() => [[]]);

  let docs = (rawDocs as any[]) || [];
  if (status === "pending") {
    docs = docs.filter((d) => !d.verified_at);
  } else if (status === "verified") {
    docs = docs.filter((d) => Boolean(d.verified_at));
  }

  const cookIds = [...new Set(docs.map((d) => String(d.cook_id || "")).filter(Boolean))];
  const cookMap = new Map<string, { display_name?: string; area?: string; slug?: string }>();
  await Promise.all(
    cookIds.map(async (id) => {
      const [rows] = await cookService.listAndCountCooks({ id } as any, { take: 1 }).catch(() => [[]]);
      const cook = (rows as any[])?.[0];
      if (cook) cookMap.set(id, { display_name: cook.display_name, area: cook.area, slug: cook.slug });
    })
  );

  const enriched = docs.map((d) => {
    const cook = cookMap.get(String(d.cook_id)) || {};
    return {
      id: d.id,
      cook_id: d.cook_id,
      cook_display_name: cook.display_name || d.cook_id,
      cook_area: cook.area || null,
      cook_slug: cook.slug || null,
      type: d.type,
      file_key: d.file_key,
      expiry_date: d.expiry_date || null,
      verified_at: d.verified_at || null,
      created_at: d.created_at || null,
      updated_at: d.updated_at || null,
    };
  });

  const pending_count = enriched.filter((d) => !d.verified_at).length;

  res.json({
    docs: enriched,
    count: enriched.length,
    pending_count,
    filters: { status, cook_id: cook_id || null },
    note: "Verify docs so cooks can Accept orders (SHC-COMPLIANCE-002 gate).",
  });
}
