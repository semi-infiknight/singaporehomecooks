"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcReviewSchema = void 0;
const zod_1 = require("zod");
// shc_review exact from blueprint/05-data-model/05-data-model.md + 08-marketplace-rules (post-collection only)
exports.shcReviewSchema = zod_1.z.object({
    id: zod_1.z.string(),
    order_id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    customer_id: zod_1.z.string(),
    rating: zod_1.z.number().int().min(1).max(5),
    body: zod_1.z.string().min(1).max(1000).optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=review.js.map