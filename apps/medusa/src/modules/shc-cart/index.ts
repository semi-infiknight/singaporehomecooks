import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Cart } from "./models/cart";

export default Module("shcCart", {
  service: Service,
});

export { Cart };
export * from "./service";