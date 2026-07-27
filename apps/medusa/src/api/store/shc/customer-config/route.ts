import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { buildCustomerConfigPayload } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import {
  loadCustomerBrowseConfig,
  loadStoredCategories,
  loadStoredPromos,
} from "../../../../lib/shc-customer-config";

/**
 * GET /store/shc/customer-config — aggregated customer browse chrome.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
    const [categories, promos, browse] = await Promise.all([
      loadStoredCategories(statService),
      loadStoredPromos(statService),
      loadCustomerBrowseConfig(statService),
    ]);
    const payload = buildCustomerConfigPayload({ categories, promos, browse });
    res.json({ ...payload, source: "platform_stat" });
  } catch (e: any) {
    const payload = buildCustomerConfigPayload({});
    res.json({ ...payload, source: "default", note: e.message });
  }
}
