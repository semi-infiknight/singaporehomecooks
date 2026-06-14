import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { OrderMeta, OrderMessage } from "./models/order-meta";

export default Module("shcOrderMeta", {
  service: Service,
});

export { OrderMeta, OrderMessage };
export * from "./service";
