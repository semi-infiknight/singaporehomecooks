import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcFeatureFlagModuleService from "../../../../modules/shc-feature-flag/service";

const QuerySchema = z
  .object({
    key: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const UpsertSchema = z
  .object({
    key: z.string().min(1),
    enabled: z.boolean(),
    cohort_filter: z.record(z.unknown()).optional(),
  })
  .strict();

const DEFAULT_FLAGS = [
  { key: "request_dish", enabled: true, cohort_filter: {} },
  { key: "home_credits", enabled: true, cohort_filter: {} },
  { key: "corporate_orders", enabled: true, cohort_filter: {} },
];

/** GET/POST /admin/shc/feature-flags — ops control for launch gates. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad feature flag query", parse.error.format() as any) });
  }

  const flagService: ShcFeatureFlagModuleService = req.scope.resolve("shcFeatureFlag") as any;
  const filters = parse.data.key ? { key: parse.data.key } : {};
  const [flags, count] = await flagService.listAndCountFeatureFlags(filters, { take: parse.data.limit });
  const byKey = new Map((flags as any[]).map((flag) => [flag.key, flag]));
  const defaults = DEFAULT_FLAGS.filter((flag) => !parse.data.key || flag.key === parse.data.key);
  const merged = [
    ...flags,
    ...defaults.filter((flag) => !byKey.has(flag.key)).map((flag) => ({ ...flag, id: `default_${flag.key}`, source: "default" })),
  ].slice(0, parse.data.limit);
  res.json({ flags: merged, count: Math.max(count, merged.length) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = UpsertSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid feature flag payload", parse.error.format() as any) });
  }

  const flagService: ShcFeatureFlagModuleService = req.scope.resolve("shcFeatureFlag") as any;
  const { key, enabled, cohort_filter = {} } = parse.data;

  try {
    const [existing] = await flagService.listAndCountFeatureFlags({ key }, { take: 1 });
    let flag;
    if (existing?.[0]?.id) {
      [flag] = await flagService.updateFeatureFlags({
        selector: { id: existing[0].id },
        data: { enabled, cohort_filter } as any,
      });
    } else {
      [flag] = await flagService.createFeatureFlags([{ key, enabled, cohort_filter } as any]);
    }

    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.feature_flags.upsert", key, enabled });
    res.json({ flag });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Feature flag update failed") });
  }
}
