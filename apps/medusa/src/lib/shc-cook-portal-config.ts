import ShcPlatformStatModuleService from "../modules/shc-platform-stat/service";
import {
  COOK_PORTAL_CONFIG_KEY,
  normalizeCookPortalConfig,
  type CookPortalConfig,
} from "@shc/utils";

export async function loadCookPortalConfig(
  statService: ShcPlatformStatModuleService
): Promise<CookPortalConfig> {
  const [existing] = await statService.listAndCountPlatformStats({ key: COOK_PORTAL_CONFIG_KEY }, { take: 1 });
  return normalizeCookPortalConfig(existing?.[0]?.value);
}

export async function saveCookPortalConfig(
  statService: ShcPlatformStatModuleService,
  config: Partial<CookPortalConfig> | CookPortalConfig
) {
  const current = await loadCookPortalConfig(statService);
  const normalized = normalizeCookPortalConfig({ ...current, ...config });
  const [existing] = await statService.listAndCountPlatformStats({ key: COOK_PORTAL_CONFIG_KEY }, { take: 1 });
  if (existing?.[0]?.id) {
    await statService.updatePlatformStats({
      selector: { id: existing[0].id },
      data: { value: normalized } as any,
    });
  } else {
    await statService.createPlatformStats([{ key: COOK_PORTAL_CONFIG_KEY, value: normalized } as any]);
  }
  return normalized;
}

export async function loadCookPortalConfigFromScope(scope: {
  resolve?: (name: string) => unknown;
}): Promise<CookPortalConfig> {
  try {
    const statService = scope.resolve?.("shcPlatformStat") as ShcPlatformStatModuleService | undefined;
    if (!statService) return normalizeCookPortalConfig();
    return loadCookPortalConfig(statService);
  } catch {
    return normalizeCookPortalConfig();
  }
}
