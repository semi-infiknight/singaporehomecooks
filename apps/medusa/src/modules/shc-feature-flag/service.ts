import { MedusaService } from "@medusajs/framework/utils";
import { FeatureFlag } from "./models/feature-flag";

class ShcFeatureFlagModuleService extends MedusaService({ FeatureFlag }) {
  async isEnabled(key: string, defaultValue = false): Promise<boolean> {
    const [rows] = await this.listAndCountFeatureFlags({ key } as any, { take: 1 }).catch(() => [[]]);
    return Boolean((rows as any[])?.[0]?.enabled ?? defaultValue);
  }
}

export default ShcFeatureFlagModuleService;
