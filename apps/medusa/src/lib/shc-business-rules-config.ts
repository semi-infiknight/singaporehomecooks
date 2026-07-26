import ShcPlatformStatModuleService from "../modules/shc-platform-stat/service";
import {
  BUSINESS_RULES_CONFIG_KEY,
  normalizeBusinessRulesConfig,
  type BusinessRulesConfig,
} from "@shc/utils";

export async function loadBusinessRulesConfig(
  statService: ShcPlatformStatModuleService
): Promise<BusinessRulesConfig> {
  const [existing] = await statService.listAndCountPlatformStats({ key: BUSINESS_RULES_CONFIG_KEY }, { take: 1 });
  return normalizeBusinessRulesConfig(existing?.[0]?.value);
}

export async function saveBusinessRulesConfig(
  statService: ShcPlatformStatModuleService,
  config: Partial<BusinessRulesConfig> | BusinessRulesConfig
) {
  const current = await loadBusinessRulesConfig(statService);
  const normalized = normalizeBusinessRulesConfig({ ...current, ...config });
  const [existing] = await statService.listAndCountPlatformStats({ key: BUSINESS_RULES_CONFIG_KEY }, { take: 1 });
  if (existing?.[0]?.id) {
    await statService.updatePlatformStats({
      selector: { id: existing[0].id },
      data: { value: normalized } as any,
    });
  } else {
    await statService.createPlatformStats([{ key: BUSINESS_RULES_CONFIG_KEY, value: normalized } as any]);
  }
  return normalized;
}

export async function loadBusinessRulesConfigFromScope(scope: { resolve?: (name: string) => unknown }): Promise<BusinessRulesConfig> {
  try {
    const statService = scope.resolve?.("shcPlatformStat") as ShcPlatformStatModuleService | undefined;
    if (!statService) return normalizeBusinessRulesConfig();
    return loadBusinessRulesConfig(statService);
  } catch {
    return normalizeBusinessRulesConfig();
  }
}
