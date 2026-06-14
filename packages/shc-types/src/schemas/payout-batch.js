"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcPayoutBatchSchema = exports.PayoutBatchStatus = void 0;
const zod_1 = require("zod");
// shc_payout_batch exact from blueprint/05-data-model/05-data-model.md
exports.PayoutBatchStatus = zod_1.z.enum(['pending', 'approved', 'paid']);
exports.shcPayoutBatchSchema = zod_1.z.object({
    id: zod_1.z.string(),
    week_start: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: exports.PayoutBatchStatus,
    total_cents: zod_1.z.number().int().nonnegative(),
    transfer_ref: zod_1.z.string().optional(),
    approved_at: zod_1.z.string().datetime().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=payout-batch.js.map