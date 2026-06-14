"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderStateTransitionSchema = exports.shcOrderMetaSchema = exports.SHCOrderStatus = void 0;
exports.validateOrderTransition = validateOrderTransition;
const zod_1 = require("zod");
// Order status enum from blueprint/09-order-state.md exactly
exports.SHCOrderStatus = zod_1.z.enum([
    'cart',
    'paid',
    'accepted',
    'preparing',
    'ready_for_collection',
    'collected',
    'completed',
    'cancelled',
    'disputed',
    'resolved',
]);
// shc_order_meta per 05-data-model.md (exact full columns)
exports.shcOrderMetaSchema = zod_1.z.object({
    order_id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    collection_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    collection_slot: zod_1.z.string(), // e.g. "18:00-19:00"
    allergen_acked_at: zod_1.z.string().datetime().optional(),
    address_released_at: zod_1.z.string().datetime().optional(),
    paynow_reference: zod_1.z.string().optional(),
    shc_status: exports.SHCOrderStatus,
    // audit
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
// State transition validation per 09-order-state.md
const validTransitions = {
    cart: ['paid'],
    paid: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready_for_collection', 'cancelled'],
    ready_for_collection: ['collected', 'cancelled'],
    collected: ['completed', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: ['resolved', 'cancelled'],
    resolved: [],
};
exports.orderStateTransitionSchema = zod_1.z.object({
    from: exports.SHCOrderStatus,
    to: exports.SHCOrderStatus,
}).refine((data) => validTransitions[data.from]?.includes(data.to), (data) => ({
    message: `Invalid transition from ${data.from} to ${data.to} - see 09-order-state.md`,
    path: ['to'],
}));
// Helper to validate transition (used by workflows)
function validateOrderTransition(from, to) {
    const result = exports.orderStateTransitionSchema.safeParse({ from, to });
    if (result.success)
        return { valid: true };
    return { valid: false, error: 'SHC-ORDER-001' };
}
//# sourceMappingURL=order.js.map