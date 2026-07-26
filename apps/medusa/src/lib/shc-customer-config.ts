import ShcPlatformStatModuleService from "../../../../modules/shc-platform-stat/service";
import { CATALOG_CATEGORIES_KEY, normalizeCategories } from "./shc-catalog-categories";
import {
  CUSTOMER_BROWSE_CONFIG_KEY,
  normalizeCustomerBrowseConfig,
  type CustomerBrowseConfig,
} from "@shc/utils";
import { DISCOVER_PROMOS_STAT_KEY, normalizeDiscoverPromoConfigs } from "./shc-discover-promos";

export async function loadCustomerBrowseConfig(statService: ShcPlatformStatModuleService): Promise<CustomerBrowseConfig> {
  const [existing] = await statService.listAndCountPlatformStats({ key: CUSTOMER_BROWSE_CONFIG_KEY }, { take: 1 });
  return normalizeCustomerBrowseConfig(existing?.[0]?.value);
}

export async function saveCustomerBrowseConfig(
  statService: ShcPlatformStatModuleService,
  config: CustomerBrowseConfig
) {
  const normalized = normalizeCustomerBrowseConfig(config);
  const [existing] = await statService.listAndCountPlatformStats({ key: CUSTOMER_BROWSE_CONFIG_KEY }, { take: 1 });
  if (existing?.[0]?.id) {
    await statService.updatePlatformStats({
      selector: { id: existing[0].id },
      data: { value: normalized } as any,
    });
  } else {
    await statService.createPlatformStats([{ key: CUSTOMER_BROWSE_CONFIG_KEY, value: normalized } as any]);
  }
  return normalized;
}

export async function loadStoredCategories(statService: ShcPlatformStatModuleService) {
  const [existing] = await statService.listAndCountPlatformStats({ key: CATALOG_CATEGORIES_KEY }, { take: 1 });
  return normalizeCategories(existing?.[0]?.value);
}

export async function loadStoredPromos(statService: ShcPlatformStatModuleService) {
  const [existing] = await statService.listAndCountPlatformStats({ key: DISCOVER_PROMOS_STAT_KEY }, { take: 1 });
  return normalizeDiscoverPromoConfigs(existing?.[0]?.value);
}
