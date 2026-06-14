import { z } from 'zod';
export declare const PayoutBatchStatus: z.ZodEnum<["pending", "approved", "paid"]>;
export type PayoutBatchStatus = z.infer<typeof PayoutBatchStatus>;
export declare const shcPayoutBatchSchema: z.ZodObject<{
    id: z.ZodString;
    week_start: z.ZodString;
    status: z.ZodEnum<["pending", "approved", "paid"]>;
    total_cents: z.ZodNumber;
    transfer_ref: z.ZodOptional<z.ZodString>;
    approved_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "paid" | "approved";
    id: string;
    week_start: string;
    total_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    transfer_ref?: string | undefined;
    approved_at?: string | undefined;
}, {
    status: "pending" | "paid" | "approved";
    id: string;
    week_start: string;
    total_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    transfer_ref?: string | undefined;
    approved_at?: string | undefined;
}>;
export type SHCPayoutBatch = z.infer<typeof shcPayoutBatchSchema>;
//# sourceMappingURL=payout-batch.d.ts.map