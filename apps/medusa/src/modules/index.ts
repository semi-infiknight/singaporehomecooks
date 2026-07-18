import ShcCookModule from "./shc-cook";
import ShcProductMetaModule from "./shc-product-meta";
import ShcOrderMetaModule from "./shc-order-meta";
import ShcAvailabilityModule from "./shc-availability";
import ShcLedgerModule from "./shc-ledger";
import ShcPayoutBatchModule from "./shc-payout-batch";
import ShcRequestModule from "./shc-request";
import ShcBidModule from "./shc-bid";
import ShcReviewModule from "./shc-review";
import ShcCartModule from "./shc-cart";
import ShcNotificationModule from "./shc-notification";
import ShcComplianceDocModule from "./shc-compliance-doc";
import ShcDisputeModule from "./shc-dispute";
import ShcCommissionRuleModule from "./shc-commission-rule";
import ShcCookExpenseModule from "./shc-cook-expense";
import ShcFeatureFlagModule from "./shc-feature-flag";
import ShcSearchSynonymModule from "./shc-search-synonym";
import ShcPlatformStatModule from "./shc-platform-stat";
import ShcTiffinModule from "./shc-tiffin";
import ShcDropModule from "./shc-drop";

// Register custom SHC modules. Links are defined separately in src/links/*
// Phase 6: added shc-ledger (double-entry) + shc-payout-batch (weekly)
// Backend-Completion (Phase 8-9): added shc-request, shc-bid for growth features.
// Cooking soon: shc-drop (cook-led batch listings).
export const modules = [
  { resolve: "./src/modules/shc-cook" },
  { resolve: "./src/modules/shc-product-meta" },
  { resolve: "./src/modules/shc-order-meta" },
  { resolve: "./src/modules/shc-availability" },
  { resolve: "./src/modules/shc-ledger" },
  { resolve: "./src/modules/shc-payout-batch" },
  { resolve: "./src/modules/shc-request" },
  { resolve: "./src/modules/shc-bid" },
  { resolve: "./src/modules/shc-review" },
  { resolve: "./src/modules/shc-cart" },
  { resolve: "./src/modules/shc-notification" },
  { resolve: "./src/modules/shc-compliance-doc" },
  { resolve: "./src/modules/shc-dispute" },
  { resolve: "./src/modules/shc-commission-rule" },
  { resolve: "./src/modules/shc-cook-expense" },
  { resolve: "./src/modules/shc-feature-flag" },
  { resolve: "./src/modules/shc-search-synonym" },
  { resolve: "./src/modules/shc-platform-stat" },
  { resolve: "./src/modules/shc-tiffin" },
  { resolve: "./src/modules/shc-drop" },
];

export {
  ShcCookModule,
  ShcProductMetaModule,
  ShcOrderMetaModule,
  ShcAvailabilityModule,
  ShcLedgerModule,
  ShcPayoutBatchModule,
  ShcRequestModule,
  ShcBidModule,
  ShcDropModule,
  ShcReviewModule,
  ShcCartModule,
  ShcNotificationModule,
  ShcComplianceDocModule,
  ShcDisputeModule,
  ShcCommissionRuleModule,
  ShcCookExpenseModule,
  ShcFeatureFlagModule,
  ShcSearchSynonymModule,
  ShcPlatformStatModule,
  ShcTiffinModule,
};