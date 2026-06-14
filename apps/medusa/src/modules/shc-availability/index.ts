import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Availability } from "./models/availability";

export default Module("shcAvailability", {
  service: Service,
});

export { Availability };
export * from "./service";
