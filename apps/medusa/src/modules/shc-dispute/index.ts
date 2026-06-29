import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Dispute } from "./models/dispute";

export default Module("shcDispute", {
  service: Service,
});

export { Dispute };
export * from "./service";
