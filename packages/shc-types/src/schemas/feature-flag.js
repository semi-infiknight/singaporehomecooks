"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcFeatureFlagSchema = void 0;
const zod_1 = require("zod");
// shc_feature_flag exact from blueprint/05-data-model/05-data-model.md
exports.shcFeatureFlagSchema = zod_1.z.object({
    key: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    cohort_filter: zod_1.z.record(zod_1.z.unknown()).optional(), // JSON
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=feature-flag.js.map