import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { PayoutBatch } from "./models/payout-batch";
import { PayoutBatchLine } from "./models/payout-batch-line";

export default Module("shcPayoutBatch", {
  service: Service,
});

export { PayoutBatch, PayoutBatchLine };
export * from "./service";
