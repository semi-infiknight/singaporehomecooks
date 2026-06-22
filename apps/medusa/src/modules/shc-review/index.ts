import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Review } from "./models/review";

export default Module("shcReview", {
  service: Service,
});

export { Review };
export * from "./service";