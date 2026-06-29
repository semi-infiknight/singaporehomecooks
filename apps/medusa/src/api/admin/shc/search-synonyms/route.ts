import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcSearchSynonymModuleService from "../../../../modules/shc-search-synonym/service";

const QuerySchema = z
  .object({
    term: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const UpsertSchema = z
  .object({
    term: z.string().min(1),
    expansions: z.array(z.string().min(1)).default([]),
  })
  .strict();

/** GET/POST /admin/shc/search-synonyms — manage local food search expansions. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad search synonym query", parse.error.format() as any) });
  }

  const synonymService: ShcSearchSynonymModuleService = req.scope.resolve("shcSearchSynonym") as any;
  const filters = parse.data.term ? { term: parse.data.term } : {};
  const [synonyms, count] = await synonymService.listAndCountSearchSynonyms(filters, { take: parse.data.limit });
  res.json({ synonyms, count });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = UpsertSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid search synonym payload", parse.error.format() as any) });
  }

  const synonymService: ShcSearchSynonymModuleService = req.scope.resolve("shcSearchSynonym") as any;
  const { term, expansions } = parse.data;
  try {
    const [existing] = await synonymService.listAndCountSearchSynonyms({ term }, { take: 1 });
    let synonym;
    if (existing?.[0]?.id) {
      [synonym] = await synonymService.updateSearchSynonyms({
        selector: { id: existing[0].id },
        data: { expansions } as any,
      });
    } else {
      [synonym] = await synonymService.createSearchSynonyms([{ term, expansions } as any]);
    }
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.search_synonyms.upsert", term, expansion_count: expansions.length });
    res.json({ synonym });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Search synonym update failed") });
  }
}
