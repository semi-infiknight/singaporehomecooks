import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../modules/shc-order-meta/service";
import ShcCookModuleService from "../../../../../modules/shc-cook/service";
import { requireCookId, requireCustomerId } from "../../../../../lib/shc-actors";
import { loadCooksById, shapeStoreOrder, type CookCollectionRow } from "../../../../../lib/shc-order-shape";

function resolveViewerRole(req: MedusaRequest): "customer" | "cook" | undefined {
  const cookId = requireCookId(req);
  if (cookId) return "cook";
  const customerId = requireCustomerId(req);
  if (customerId) return "customer";
  return undefined;
}

/** GET /store/shc/orders/:id — single order with messages */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(id);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }
  const m = data.meta as any;
  const viewerRole = resolveViewerRole(req);
  let cook: CookCollectionRow | null = null;
  if (m.cook_id) {
    const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
    const cooks = await loadCooksById(cookService, [String(m.cook_id)]);
    cook = cooks.get(String(m.cook_id)) || null;
  }

  res.json({
    order: shapeStoreOrder(m, cook, { viewerRole }),
    messages: data.messages || [],
  });
}
