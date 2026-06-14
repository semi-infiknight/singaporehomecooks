import type { MedusaContainer } from "@medusajs/framework/types";

/** Medusa v2 DI keys for SHC custom modules (see .medusa/types/modules-bindings.d.ts). */
export const SHC_MODULES = {
  cook: "shcCook",
  productMeta: "shcProductMeta",
  orderMeta: "shcOrderMeta",
  availability: "shcAvailability",
  ledger: "shcLedger",
  payoutBatch: "shcPayoutBatch",
  request: "shcRequest",
  bid: "shcBid",
  creditWallet: "shcCreditWallet",
  heritage: "shcHeritage",
  product: "product",
  order: "order",
} as const;

export function resolveModule<T>(scope: MedusaContainer, key: keyof typeof SHC_MODULES): T {
  return scope.resolve(SHC_MODULES[key]) as T;
}