import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { LedgerEntry } from "./models/ledger-entry";

export default Module("shcLedger", {
  service: Service,
});

export { LedgerEntry };
export * from "./service";
