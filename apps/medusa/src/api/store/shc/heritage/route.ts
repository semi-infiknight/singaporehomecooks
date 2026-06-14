import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcHeritageModuleService from "../../../../modules/shc-heritage/service";

/**
 * GET /store/shc/heritage?cook_id=...
 * Get published heritage archive for cook (visible on profile even inactive).
 * POST /store/shc/heritage
 * Add entry (cook dashboard). Published by default. Zod/SHC/audit.
 */
const QuerySchema = z.object({
  cook_id: z.string(),
}).strict();

const AddSchema = z.object({
  cook_id: z.string().optional(),
  title: z.string().min(3),
  story: z.string().min(10),
  photo_stub: z.string().optional(),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad heritage query (cook_id required)", parse.error.format() as any) });
  }
  const herService: ShcHeritageModuleService = req.scope.resolve("shcHeritage") as any;
  const cookId = parse.data.cook_id;
  try {
    const archive = await herService.getArchiveForCook(cookId);
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.heritage.get", cook_id: cookId, count: archive.length });
    res.json({ archive, cook_id: cookId });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Get heritage failed") });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = AddSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid heritage entry", parse.error.format() as any) });
  }
  const herService: ShcHeritageModuleService = req.scope.resolve("shcHeritage") as any;
  const actor = (req as any).auth?.actor_id || parse.data.cook_id || "cook-unknown";
  const cookId = parse.data.cook_id || actor;
  try {
    const before = { cook_id: cookId };
    const entry = await herService.addEntry(cookId, { title: parse.data.title, story: parse.data.story, photo_stub: parse.data.photo_stub });
    const logger = (req.scope as any).resolve?.("logger") || console;
    const audit = { ts: new Date().toISOString(), actor, action: "heritage.add", before, after: entry };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    res.status(201).json({ entry });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Add heritage failed") });
  }
}
