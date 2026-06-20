import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcRequestModuleService from "../../../../modules/shc-request/service";
import { getAuthContext, getCustomerId, unauthorized } from "../../../../lib/shc-actors";

/**
 * GET /store/shc/requests
 * List open/bidding requests (public for cooks to see collab board).
 * POST /store/shc/requests
 * Create new recipe request (customer). Requires body min length. Emits shc.request.created for notifs/subscribers.
 * All: Zod strict, SHCErrorCode returns, full audit logs (actor/action/before-after per hardening).
 * Corporate tie: optional corporate flag on request (future multi).
 */
const CreateSchema = z.object({
  body: z.string().min(10),
  youtube_url: z.string().url().optional(),
  party_size: z.number().int().positive().optional(),
  budget_cents: z.number().int().nonnegative().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  corporate: z.boolean().optional(), // tie corporate flag
}).strict();

const QuerySchema = z.object({
  limit: z.coerce.number().default(20),
}).strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any) });
  }
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequest") as any;
  try {
    const requests = await reqService.listOpenRequests({ limit: parse.data.limit });
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.requests.list", count: requests.length });
    res.json({ requests, count: requests.length });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "List requests failed") });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid request payload", parse.error.format() as any) });
  }
  getAuthContext(req);
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequest") as any;
  let actor: string;
  try {
    actor = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }
  try {
    const before = {};
    const created = await reqService.createRequest({
      ...parse.data,
      customer_id: actor,
      status: "open",
    } as any);
    // Audit (production-hardening)
    const logger = (req.scope as any).resolve?.("logger") || console;
    const audit = {
      ts: new Date().toISOString(),
      actor,
      action: "request.create",
      before,
      after: created,
      meta: { corporate: !!parse.data.corporate },
    };
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify(audit)}`);
    // Emit for subscribers/notifs (tie corporate, growth)
    const eventBus = req.scope.resolve("eventBusService") as any;
    await eventBus.emit("shc.request.created", { requestId: created.id, customerId: actor, corporate: parse.data.corporate });
    res.status(201).json({ request: created });
  } catch (e: any) {
    const code = e.code || "SHC-REQ-001";
    res.status(400).json({ error: createSHCError(code as any, e.message || "Create request failed") });
  }
}
