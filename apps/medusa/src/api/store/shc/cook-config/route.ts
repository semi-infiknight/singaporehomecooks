import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { defaultCookPortalConfig } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { loadCookPortalConfig } from "../../../../lib/shc-cook-portal-config";

/** GET /store/shc/cook-config — cook portal chrome for web + mobile cook (and chat replies). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
    const config = await loadCookPortalConfig(statService);
    res.json({ config, source: "platform_stat" });
  } catch (e: any) {
    const config = defaultCookPortalConfig();
    res.json({ config, source: "default", note: e.message });
  }
}
