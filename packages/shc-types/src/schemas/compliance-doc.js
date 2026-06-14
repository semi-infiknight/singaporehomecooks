"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcComplianceDocSchema = exports.ComplianceDocType = void 0;
const zod_1 = require("zod");
// shc_compliance_doc exact from blueprint/05-data-model/05-data-model.md
exports.ComplianceDocType = zod_1.z.enum(['sfa', 'wsq']);
exports.shcComplianceDocSchema = zod_1.z.object({
    id: zod_1.z.string(),
    cook_id: zod_1.z.string(),
    type: exports.ComplianceDocType,
    file_key: zod_1.z.string(), // MinIO key
    expiry_date: zod_1.z.string().datetime().optional(),
    verified_at: zod_1.z.string().datetime().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=compliance-doc.js.map