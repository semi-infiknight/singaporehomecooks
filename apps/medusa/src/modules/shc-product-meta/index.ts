import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { ProductMeta } from "./models/product-meta";

export default Module("shcProductMeta", {
  service: Service,
});

export { ProductMeta };
export * from "./service";
