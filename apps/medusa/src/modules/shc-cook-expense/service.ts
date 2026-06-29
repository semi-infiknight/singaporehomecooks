import { MedusaService } from "@medusajs/framework/utils";
import { CookExpense } from "./models/cook-expense";

class ShcCookExpenseModuleService extends MedusaService({ CookExpense }) {}

export default ShcCookExpenseModuleService;
