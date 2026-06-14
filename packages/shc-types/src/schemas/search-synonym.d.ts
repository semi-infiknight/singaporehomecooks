import { z } from 'zod';
export declare const shcSearchSynonymSchema: z.ZodObject<{
    term: z.ZodString;
    expansions: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    term: string;
    expansions: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    term: string;
    expansions: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type SHCSearchSynonym = z.infer<typeof shcSearchSynonymSchema>;
//# sourceMappingURL=search-synonym.d.ts.map