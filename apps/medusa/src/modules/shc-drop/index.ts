import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Drop } from "./models/drop";

export default Module("shcDrop", {
  service: Service,
});

export { Drop };
export * from "./service";
