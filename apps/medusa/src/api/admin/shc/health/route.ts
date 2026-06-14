import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** GET /admin/shc/health */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({ status: "ok", service: "admin-shc", time: new Date().toISOString() });
}
