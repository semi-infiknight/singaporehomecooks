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
// Canonical exports for Singapore Home Cooks contracts v1 (Contracts Track)
// Full export of all Zod schemas for EVERY table in 05-data-model.md, SHCErrorCode enum + map matching ERROR_CODES.md, status enums.
__exportStar(require("./schemas"), exports);
__exportStar(require("./errors"), exports);
// NOTE: business-rules live in dedicated @shc/business-rules package (Contracts owns both).
// Import schemas/types from '@shc/types'; rule functions from '@shc/business-rules' (depends on this pkg).
//# sourceMappingURL=index.js.map