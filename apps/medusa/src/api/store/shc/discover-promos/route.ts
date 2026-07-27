import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  DISCOVER_PROMOS_STAT_KEY,
  defaultDiscoverPromoConfigs,
  discoverPromoConfigsToSlides,
  normalizeDiscoverPromoConfigs,
} from "../../../../lib/shc-discover-promos";

/**
 * GET /store/shc/discover-promos — public discover home carousel slides.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const statService: any = req.scope.resolve("shcPlatformStat");
    const [existing] = await statService.listAndCountPlatformStats({ key: DISCOVER_PROMOS_STAT_KEY }, { take: 1 });
    const raw = existing?.[0]?.value;
    const configs =
      Array.isArray(raw) && raw.length > 0
        ? normalizeDiscoverPromoConfigs(raw)
        : defaultDiscoverPromoConfigs();
    const promos = discoverPromoConfigsToSlides(configs);
    res.json({ promos, count: promos.length });
  } catch {
    const promos = discoverPromoConfigsToSlides(defaultDiscoverPromoConfigs());
    res.json({ promos, count: promos.length, source: "default" });
  }
}
