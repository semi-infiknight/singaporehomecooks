"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcProductWithMetaSchema = exports.shcCookOrderLinkSchema = exports.shcCookProductLinkSchema = void 0;
const zod_1 = require("zod");
// Medusa link definitions per 05-data-model.md (Contracts owns)
// These are used for validation of link records / join payloads in modules and API surface.
exports.shcCookProductLinkSchema = zod_1.z.object({
    cook_id: zod_1.z.string(),
    product_id: zod_1.z.string(),
    created_at: zod_1.z.string().datetime().optional(),
}).strict();
exports.shcCookOrderLinkSchema = zod_1.z.object({
    cook_id: zod_1.z.string(),
    order_id: zod_1.z.string(),
    // one cook per order MVP rule enforced via business-rules
}).strict();
// Example Medusa extended for payload contracts (future API)
exports.shcProductWithMetaSchema = zod_1.z.object({
    product_id: zod_1.z.string(),
    // plus native medusa product fields validated at boundary
    shc_meta: zod_1.z.any(), // use shcProductMetaSchema in practice
}).strict();
//# sourceMappingURL=medusa-links.js.map