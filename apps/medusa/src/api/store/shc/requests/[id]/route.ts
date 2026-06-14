import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcRequestModuleService from "../../../../../modules/shc-request/service";

/**
 * GET /store/shc/requests/:id
 * Get single request (for bid context or detail). Zod/SHC/audit.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const reqService: ShcRequestModuleService = req.scope.resolve("shcRequestService") as any;
  try {
    const request = await reqService.getRequest(id);
    if (!request) {
      return res.status(404).json({ error: createSHCError("SHC-REQ-001", "Request not found") });
    }
    const logger = (req.scope as any).resolve?.("logger") || console;
    (logger as any).info?.({ event: "store.requests.get", id });
    res.json({ request });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-REQ-001", e.message || "Get request failed") });
  }
}
