import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { logError, logInfo, triggerOpsAlert } from "../../../../../lib/shc-observability";

/** POST /store/shc/ops/client-crash — lightweight client crash reports (rate-limited in middleware) */
const BodySchema = z
  .object({
    surface: z.enum(["web", "mobile-customer", "mobile-cook"]),
    message: z.string().min(1).max(2000),
    stack: z.string().max(8000).optional(),
    component_stack: z.string().max(8000).optional(),
    error_code: z.string().max(64).optional(),
    build_id: z.string().max(128).optional(),
    route: z.string().max(256).optional(),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid crash report") });
  }

  const requestId = String((req as any).request_id || req.headers["x-request-id"] || "");
  const payload = {
    event: "client.crash",
    request_id: requestId,
    trace_id: (req as any).trace_id,
    ...parse.data,
  };

  logError({ ...payload, error: parse.data.message });

  if (process.env.SHC_CLIENT_CRASH_ALERTS === "1") {
    void triggerOpsAlert({
      severity: "warning",
      summary: `Client crash on ${parse.data.surface}: ${parse.data.message.slice(0, 120)}`,
      source: `shc-${parse.data.surface}`,
      dedupeKey: `client-crash-${parse.data.surface}-${parse.data.error_code || "generic"}`,
      details: payload,
    });
  } else {
    logInfo({ event: "client.crash.logged", surface: parse.data.surface, request_id: requestId });
  }

  return res.status(202).json({ accepted: true, request_id: requestId });
}
