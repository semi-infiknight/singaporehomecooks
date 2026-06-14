import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Bid } from "./models/bid";

export default Module("shcBid", {
  service: Service,
});

export { Bid };
export * from "./service";
