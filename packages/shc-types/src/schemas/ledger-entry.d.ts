import { z } from 'zod';
export declare const shcLedgerEntrySchema: z.ZodObject<{
    id: z.ZodString;
    order_id: z.ZodOptional<z.ZodString>;
    debit_account: z.ZodString;
    credit_account: z.ZodString;
    amount_cents: z.ZodNumber;
    batch_id: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    debit_account: string;
    credit_account: string;
    amount_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    order_id?: string | undefined;
    batch_id?: string | undefined;
}, {
    id: string;
    debit_account: string;
    credit_account: string;
    amount_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    order_id?: string | undefined;
    batch_id?: string | undefined;
}>;
export type SHCLedgerEntry = z.infer<typeof shcLedgerEntrySchema>;
//# sourceMappingURL=ledger-entry.d.ts.map