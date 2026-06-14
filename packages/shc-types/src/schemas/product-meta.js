"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcProductMetaSchema = void 0;
const zod_1 = require("zod");
// Exact fields from blueprint/05-data-model/05-data-model.md (full)
exports.shcProductMetaSchema = zod_1.z.object({
    product_id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    cuisine: zod_1.z.string(),
    occasion_tags: zod_1.z.array(zod_1.z.string()),
    allergen_tiers: zod_1.z.object({
        tier1: zod_1.z.array(zod_1.z.string()), // mandatory
        tier2: zod_1.z.array(zod_1.z.string()).optional(),
        tier3: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    halal: zod_1.z.boolean(),
    calories: zod_1.z.number().int().optional(),
    calories_confidence: zod_1.z.enum(['full', 'category']),
    ingredients: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        quantity: zod_1.z.number(),
        unit: zod_1.z.string(),
    })),
    min_qty: zod_1.z.number().int().positive(),
    last_minute_premium_pct: zod_1.z.number().min(0).max(100).optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=product-meta.js.map