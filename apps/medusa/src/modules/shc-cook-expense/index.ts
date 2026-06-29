import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { CookExpense } from "./models/cook-expense";

export default Module("shcCookExpense", {
  service: Service,
});

export { CookExpense };
export * from "./service";
