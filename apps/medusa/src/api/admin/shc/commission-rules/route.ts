import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCommissionRuleModuleService from "../../../../modules/shc-commission-rule/service";

const QuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const CreateSchema = z
  .object({
    version: z.number().int().positive(),
    rate_pct: z.number().min(0).max(100),
    effective_from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    gst_rate: z.number().min(0).max(100).optional(),
    created_by: z.string().min(1).default("ops"),
  })
  .strict();

/** GET/POST /admin/shc/commission-rules — ops-controlled commission schedule. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad commission rule query", parse.error.format() as any) });
  }

  const ruleService: ShcCommissionRuleModuleService = req.scope.resolve("shcCommissionRule") as any;
  const [rules, count] = await ruleService.listAndCountCommissionRules({}, { take: parse.data.limit, order: { version: "DESC" } });
  res.json({ rules, count });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid commission rule payload", parse.error.format() as any) });
  }

  const ruleService: ShcCommissionRuleModuleService = req.scope.resolve("shcCommissionRule") as any;
  try {
    const [rule] = await ruleService.createCommissionRules([
      {
        ...parse.data,
        effective_from: new Date(parse.data.effective_from),
        gst_rate: parse.data.gst_rate ?? null,
      } as any,
    ]);
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.commission_rules.create", version: parse.data.version, rate_pct: parse.data.rate_pct });
    res.status(201).json({ rule });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Commission rule create failed") });
  }
}
