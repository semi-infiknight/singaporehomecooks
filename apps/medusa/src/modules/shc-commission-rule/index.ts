import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { CommissionRule } from "./models/commission-rule";

export default Module("shcCommissionRule", {
  service: Service,
});

export { CommissionRule };
export * from "./service";
