"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shcLedgerEntrySchema = void 0;
const zod_1 = require("zod");
// shc_ledger_entry exact from blueprint/05-data-model/05-data-model.md (double-entry)
exports.shcLedgerEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    order_id: zod_1.z.string().optional(),
    debit_account: zod_1.z.string(),
    credit_account: zod_1.z.string(),
    amount_cents: zod_1.z.number().int().positive(),
    batch_id: zod_1.z.string().optional(),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
}).strict();
//# sourceMappingURL=ledger-entry.js.map