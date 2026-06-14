import { z } from 'zod';
export declare const shcPlatformStatSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    value: string | number | Record<string, unknown>;
    key: string;
    updated_at?: string | undefined;
}, {
    value: string | number | Record<string, unknown>;
    key: string;
    updated_at?: string | undefined;
}>;
export type SHCPlatformStat = z.infer<typeof shcPlatformStatSchema>;
//# sourceMappingURL=platform-stat.d.ts.map