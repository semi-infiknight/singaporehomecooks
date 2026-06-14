"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./cook"), exports);
__exportStar(require("./product-meta"), exports);
__exportStar(require("./order"), exports);
__exportStar(require("./availability"), exports);
__exportStar(require("./compliance-doc"), exports);
__exportStar(require("./order-message"), exports);
__exportStar(require("./review"), exports);
__exportStar(require("./dispute"), exports);
__exportStar(require("./commission-rule"), exports);
__exportStar(require("./ledger-entry"), exports);
__exportStar(require("./payout-batch"), exports);
__exportStar(require("./cook-expense"), exports);
__exportStar(require("./feature-flag"), exports);
__exportStar(require("./search-synonym"), exports);
__exportStar(require("./platform-stat"), exports);
__exportStar(require("./request"), exports);
__exportStar(require("./bid"), exports);
__exportStar(require("./medusa-links"), exports);
__exportStar(require("../errors"), exports);
// Re-export all table schemas for full contracts coverage (exact per 05-data-model.md updated by Contracts-Agent)
// All 17+ custom tables + Medusa links + status enums. All .strict(). See also 06-api-surface.md, 08, 09 for usage.
//# sourceMappingURL=index.js.map