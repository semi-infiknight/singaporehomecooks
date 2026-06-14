import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { PayoutBatch } from "./models/payout-batch";

export default Module("shcPayoutBatch", {
  service: Service,
});

export { PayoutBatch };
export * from "./service";
