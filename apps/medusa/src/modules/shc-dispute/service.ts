import { MedusaService } from "@medusajs/framework/utils";
import { Dispute } from "./models/dispute";

class ShcDisputeModuleService extends MedusaService({ Dispute }) {}

export default ShcDisputeModuleService;
