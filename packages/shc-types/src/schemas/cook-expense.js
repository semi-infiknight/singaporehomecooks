"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcCookExpenseSchema = void 0;
const zod_1 = require("zod");
// shc_cook_expense exact from blueprint/05-data-model/05-data-model.md
exports.shcCookExpenseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    amount_cents: zod_1.z.number().int().positive(),
    category: zod_1.z.string(),
    receipt_key: zod_1.z.string().optional(), // MinIO
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=cook-expense.js.map