"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcPlatformStatSchema = void 0;
const zod_1 = require("zod");
// shc_platform_stat exact from blueprint/05-data-model/05-data-model.md
exports.shcPlatformStatSchema = zod_1.z.object({
    key: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.number(), zod_1.z.string(), zod_1.z.record(zod_1.z.unknown())]), // JSON or primitive
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=platform-stat.js.map