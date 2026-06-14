import { z } from 'zod';
export declare const shcFeatureFlagSchema: z.ZodObject<{
    key: z.ZodString;
    enabled: z.ZodBoolean;
    cohort_filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    key: string;
    enabled: boolean;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    cohort_filter?: Record<string, unknown> | undefined;
}, {
    key: string;
    enabled: boolean;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    cohort_filter?: Record<string, unknown> | undefined;
}>;
export type SHCFeatureFlag = z.infer<typeof shcFeatureFlagSchema>;
//# sourceMappingURL=feature-flag.d.ts.map