import ShcCookModule from "./shc-cook";
import ShcProductMetaModule from "./shc-product-meta";
import ShcOrderMetaModule from "./shc-order-meta";
import ShcAvailabilityModule from "./shc-availability";
import ShcLedgerModule from "./shc-ledger";
import ShcPayoutBatchModule from "./shc-payout-batch";
import ShcRequestModule from "./shc-request";
import ShcBidModule from "./shc-bid";
import ShcCreditWalletModule from "./shc-credit-wallet";
import ShcHeritageModule from "./shc-heritage";

// Register custom SHC modules. Links are defined separately in src/links/*
// Phase 6: added shc-ledger (double-entry) + shc-payout-batch (weekly)
// Backend-Completion (Phase 8-9): added shc-request, shc-bid, shc-credit-wallet, shc-heritage for growth features.
export const modules = [
  {
    resolve: "./src/modules/shc-cook",
  },
  {
    resolve: "./src/modules/shc-product-meta",
  },
  {
    resolve: "./src/modules/shc-order-meta",
  },
  {
    resolve: "./src/modules/shc-availability",
  },
  {
    resolve: "./src/modules/shc-ledger",
  },
  {
    resolve: "./src/modules/shc-payout-batch",
  },
  {
    resolve: "./src/modules/shc-request",
  },
  {
    resolve: "./src/modules/shc-bid",
  },
  {
    resolve: "./src/modules/shc-credit-wallet",
  },
  {
    resolve: "./src/modules/shc-heritage",
  },
];

// Re-export for direct import if needed by workflows
export {
  ShcCookModule,
  ShcProductMetaModule,
  ShcOrderMetaModule,
  ShcAvailabilityModule,
  ShcLedgerModule,
  ShcPayoutBatchModule,
  ShcRequestModule,
  ShcBidModule,
  ShcCreditWalletModule,
  ShcHeritageModule,
};
