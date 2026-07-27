import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { defaultBusinessRulesConfig } from "@shc/utils";
import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { loadBusinessRulesConfig } from "../../../../lib/shc-business-rules-config";

/** GET /store/shc/business-rules — public read for client cutoffs and cart policy hints. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const statService: ShcPlatformStatModuleService = req.scope.resolve("shcPlatformStat") as any;
    const config = await loadBusinessRulesConfig(statService);
    res.json({ config, source: "platform_stat" });
  } catch (e: any) {
    const config = defaultBusinessRulesConfig();
    res.json({ config, source: "default", note: e.message });
  }
}
