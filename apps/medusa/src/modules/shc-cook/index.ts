import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Cook } from "./models/cook";

export default Module("shcCook", {
  service: Service,
});

// Export for link definitions and external use
export { Cook };
export * from "./service";
