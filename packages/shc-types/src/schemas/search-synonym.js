"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcSearchSynonymSchema = void 0;
const zod_1 = require("zod");
// shc_search_synonym exact from blueprint/05-data-model/05-data-model.md
exports.shcSearchSynonymSchema = zod_1.z.object({
    term: zod_1.z.string(),
    expansions: zod_1.z.array(zod_1.z.string()),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=search-synonym.js.map