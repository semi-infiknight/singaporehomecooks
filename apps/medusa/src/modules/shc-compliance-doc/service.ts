import { MedusaService } from "@medusajs/framework/utils";
import { ComplianceDoc } from "./models/compliance-doc";

class ShcComplianceDocModuleService extends MedusaService({ ComplianceDoc }) {}

export default ShcComplianceDocModuleService;
