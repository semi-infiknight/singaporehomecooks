import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Request } from "./models/request";

export default Module("shcRequest", {
  service: Service,
});

export { Request };
export * from "./service";
