import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** GET /store/shc/health - liveness for monitoring */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ status: "ok", service: "store-shc", time: new Date().toISOString() });
}
