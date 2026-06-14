"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcBidSchema = exports.BidStatus = void 0;
const zod_1 = require("zod");
// shc_bid exact from blueprint/05-data-model/05-data-model.md (Phase 8)
exports.BidStatus = zod_1.z.enum(['pending', 'accepted', 'rejected']);
exports.shcBidSchema = zod_1.z.object({
    id: zod_1.z.string(),
    request_id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    price_cents: zod_1.z.number().int().positive(),
    message: zod_1.z.string().optional(),
    status: exports.BidStatus,
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=bid.js.map