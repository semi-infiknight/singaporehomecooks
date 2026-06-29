import { MedusaService } from "@medusajs/framework/utils";
import { SearchSynonym } from "./models/search-synonym";

class ShcSearchSynonymModuleService extends MedusaService({ SearchSynonym }) {}

export default ShcSearchSynonymModuleService;
