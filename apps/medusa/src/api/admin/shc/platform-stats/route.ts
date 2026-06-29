import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";

const QuerySchema = z
  .object({
    key: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const UpsertSchema = z
  .object({
    key: z.string().min(1),
    value: z.unknown(),
  })
  .strict();

/** GET/POST /admin/shc/platform-stats — ops-maintained launch metrics. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad platform stat query", parse.error.format() as any) });
  }

  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  const filters = parse.data.key ? { key: parse.data.key } : {};
  const [stats, count] = await statService.listAndCountPlatformStats(filters, { take: parse.data.limit });
  res.json({ stats, count });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = UpsertSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid platform stat payload", parse.error.format() as any) });
  }

  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
  const { key, value } = parse.data;
  try {
    const [existing] = await statService.listAndCountPlatformStats({ key }, { take: 1 });
    let stat;
    if (existing?.[0]?.id) {
      [stat] = await statService.updatePlatformStats({
        selector: { id: existing[0].id },
        data: { value } as any,
      });
    } else {
      [stat] = await statService.createPlatformStats([{ key, value } as any]);
    }
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.platform_stats.upsert", key });
    res.json({ stat });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Platform stat update failed") });
  }
}
