import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";

export function requireWorker(req: MedusaRequest, res: MedusaResponse): boolean {
  const expected = process.env.WORKER_API_KEY;
  if (!expected) {
    res.status(503).json({ error: createSHCError("SHC-GENERIC-001", "WORKER_API_KEY not configured") });
    return false;
  }
  const provided = (req.headers as any)["x-worker-api-key"] || (req.headers as any)["X-Worker-Api-Key"];
  if (provided !== expected) {
    res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Unauthorized worker request") });
    return false;
  }
  return true;
}
