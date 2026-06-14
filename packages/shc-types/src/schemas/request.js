"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcRequestSchema = exports.RequestStatus = void 0;
const zod_1 = require("zod");
// shc_request exact from blueprint/05-data-model/05-data-model.md (Phase 8)
exports.RequestStatus = zod_1.z.enum(['open', 'bidding', 'matched', 'closed']);
exports.shcRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    customer_id: zod_1.z.string(),
    body: zod_1.z.string().min(10),
    youtube_url: zod_1.z.string().url().optional(),
    party_size: zod_1.z.number().int().positive().optional(),
    budget_cents: zod_1.z.number().int().nonnegative().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: exports.RequestStatus,
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=request.js.map