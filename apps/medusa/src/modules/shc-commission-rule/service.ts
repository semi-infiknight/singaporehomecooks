import { MedusaService } from "@medusajs/framework/utils";
import { CommissionRule } from "./models/commission-rule";

class ShcCommissionRuleModuleService extends MedusaService({ CommissionRule }) {}

export default ShcCommissionRuleModuleService;
