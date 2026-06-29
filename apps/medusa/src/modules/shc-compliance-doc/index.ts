import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { ComplianceDoc } from "./models/compliance-doc";

export default Module("shcComplianceDoc", {
  service: Service,
});

export { ComplianceDoc };
export * from "./service";
