import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import ShcCookModuleService from "../../../../modules/shc-cook/service";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { resolvePlatformCounters } from "../../../../lib/shc-platform-counters";

/**
 * GET /store/shc/platform-stats
 * Public homepage social-proof counters (live DB when cooks exist, else seeded launch defaults).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const orderMetaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;

  const result = await resolvePlatformCounters({ cookService, orderMetaService, statService });
  res.json(result);
}
