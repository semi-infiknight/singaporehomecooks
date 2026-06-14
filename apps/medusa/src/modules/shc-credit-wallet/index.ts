import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { CreditWallet } from "./models/credit-wallet";

export default Module("shcCreditWallet", {
  service: Service,
});

export { CreditWallet };
export * from "./service";
