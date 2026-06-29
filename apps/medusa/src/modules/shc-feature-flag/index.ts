import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { FeatureFlag } from "./models/feature-flag";

export default Module("shcFeatureFlag", {
  service: Service,
});

export { FeatureFlag };
export * from "./service";
