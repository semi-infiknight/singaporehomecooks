"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portionsCheckInputSchema = exports.shcAvailabilitySchema = void 0;
const zod_1 = require("zod");
// shc_availability exact from blueprint/05-data-model/05-data-model.md (Contracts Track)
exports.shcAvailabilitySchema = zod_1.z.object({
    product_id: zod_1.z.string(),
    portions_per_day: zod_1.z.number().int().positive(),
    collection_days: zod_1.z.array(zod_1.z.number().int().min(0).max(6)),
    time_slots: zod_1.z.array(zod_1.z.string()),
    paused: zod_1.z.boolean(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
// For portions rule usage (e.g. check remaining)
exports.portionsCheckInputSchema = zod_1.z.object({
    product_id: zod_1.z.string(),
    requested_qty: zod_1.z.number().int().positive(),
    collection_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();
//# sourceMappingURL=availability.js.map