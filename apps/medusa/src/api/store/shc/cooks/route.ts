import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import ShcCookModuleService from "../../../../modules/shc-cook/service";
import { SHCErrorCode, createSHCError } from "@shc/types";

const QuerySchema = z.object({
  status: z.enum(["active", "pending", "paused"]).optional(),
  area: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
}).strict();

/**
 * GET /store/shc/cooks
 * Public cooks list (active by default).
 * Production: rate limit + optional auth.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Publishable key handling (Medusa standard for /store): client must send x-publishable-api-key or sales channel scoped.
  // Simple stub: log presence for audit/rate (full rate limit in prod via middleware).
  const pubKey = (req.headers as any)['x-publishable-api-key'] || (req as any).query?.publishable_key;
  const logger = (req.scope as any).resolve?.("logger") ?? console;
  logger.info?.(`[SHC-STORE] /cooks pubkey=${pubKey ? 'present' : 'missing'} actor=public`);

  // Simple auth stub for protected future: if no key and sensitive, reject (here public list ok)
  if (!pubKey && process.env.NODE_ENV === 'production') {
    // In full production: enforce
  }

  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid query", parse.error.format() as any) });
  }
  const { status = "active", area, limit, offset } = parse.data;

  const cookService: ShcCookModuleService = req.scope.resolve("shcCookService") as any;
  const [cooks, count] = await cookService.listAndCountCooks({
    filters: { ...(status && { status }), ...(area && { area }) },
    skip: offset,
    take: limit,
    order: { display_name: "ASC" },
  });

  // Audit stub for list access (personal data related for cooks)
  logger.info?.(`[SHC-AUDIT] ${JSON.stringify({ ts: new Date().toISOString(), actor: 'store-public', action: 'cooks.list', meta: { count, pubKeyPresent: !!pubKey } })}`);

  res.json({
    cooks: cooks.map((c: any) => ({
      id: c.id,
      slug: c.slug,
      display_name: c.display_name,
      area: c.area,
      story: c.story,
      status: c.status,
      rating: 4.8, // stub until reviews module
    })),
    count,
    limit,
    offset,
  });
}
