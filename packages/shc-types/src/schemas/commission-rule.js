"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcCommissionRuleSchema = void 0;
const zod_1 = require("zod");
// shc_commission_rule exact from blueprint/05-data-model/05-data-model.md + GST/locked 15% default
exports.shcCommissionRuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    version: zod_1.z.number().int().positive(),
    rate_pct: zod_1.z.number().min(0).max(100),
    effective_from: zod_1.z.string().datetime(),
    gst_rate: zod_1.z.number().min(0).max(100).optional(),
    created_by: zod_1.z.string(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=commission-rule.js.map