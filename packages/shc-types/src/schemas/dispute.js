"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcDisputeSchema = exports.DisputeStatus = exports.DisputeType = void 0;
const zod_1 = require("zod");
// shc_dispute exact from blueprint/05-data-model/05-data-model.md + 09-order-state
exports.DisputeType = zod_1.z.enum(['customer_complaint', 'cook_cancelled_late', 'quality', 'other']);
exports.DisputeStatus = zod_1.z.enum(['open', 'resolved', 'cancelled']);
exports.shcDisputeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order_id: zod_1.z.string(),
    raised_by: zod_1.z.enum(['customer', 'cook', 'ops']),
    type: exports.DisputeType,
    status: exports.DisputeStatus,
    notes: zod_1.z.string().optional(),
    resolution: zod_1.z.string().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=dispute.js.map