"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcOrderMessageSchema = exports.SenderActor = void 0;
const zod_1 = require("zod");
// shc_order_message exact from blueprint/05-data-model/05-data-model.md
exports.SenderActor = zod_1.z.enum(['customer', 'cook', 'ops']);
exports.shcOrderMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order_id: zod_1.z.string(),
    sender_actor: exports.SenderActor,
    sender_id: zod_1.z.string(),
    body: zod_1.z.string().min(1).max(2000),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=order-message.js.map