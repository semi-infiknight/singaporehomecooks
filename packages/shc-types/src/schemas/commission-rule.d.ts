import { z } from 'zod';
export declare const shcCommissionRuleSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodNumber;
    rate_pct: z.ZodNumber;
    effective_from: z.ZodString;
    gst_rate: z.ZodOptional<z.ZodNumber>;
    created_by: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    version: number;
    rate_pct: number;
    effective_from: string;
    created_by: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    gst_rate?: number | undefined;
}, {
    id: string;
    version: number;
    rate_pct: number;
    effective_from: string;
    created_by: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    gst_rate?: number | undefined;
}>;
export type SHCCommissionRule = z.infer<typeof shcCommissionRuleSchema>;
//# sourceMappingURL=commission-rule.d.ts.map