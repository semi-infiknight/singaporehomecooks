import { z } from 'zod';
export declare const shcCookExpenseSchema: z.ZodObject<{
    id: z.ZodString;
    cook_id: z.ZodString;
    amount_cents: z.ZodNumber;
    category: z.ZodString;
    receipt_key: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    cook_id: string;
    date: string;
    category: string;
    amount_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    receipt_key?: string | undefined;
}, {
    id: string;
    cook_id: string;
    date: string;
    category: string;
    amount_cents: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    receipt_key?: string | undefined;
}>;
export type SHCCookExpense = z.infer<typeof shcCookExpenseSchema>;
//# sourceMappingURL=cook-expense.d.ts.map