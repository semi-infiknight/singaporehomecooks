"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcCookSchema = exports.CookStatus = void 0;
const zod_1 = require("zod");
// Exact fields from blueprint/05-data-model/05-data-model.md (Contracts Track owns; .strict())
exports.CookStatus = zod_1.z.enum(['pending', 'active', 'paused', 'suspended']);
exports.shcCookSchema = zod_1.z.object({
    id: zod_1.z.string(),
    auth_identity_id: zod_1.z.string(),
    slug: zod_1.z.string(),
    display_name: zod_1.z.string(),
    story: zod_1.z.string().optional(),
    area: zod_1.z.string(),
    collection_address: zod_1.z.string().optional(),
    collection_instructions: zod_1.z.string().optional(),
    status: exports.CookStatus,
    availability_paused: zod_1.z.boolean().default(false),
    expo_push_token: zod_1.z.string().optional(),
    sfa_reg_number: zod_1.z.string().optional(),
    wsq_cert_expiry: zod_1.z.string().datetime().optional(),
    pdpa_consent_at: zod_1.z.string().datetime().optional(),
    pdpa_consent_version: zod_1.z.string().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=cook.js.map