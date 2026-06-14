import { z } from 'zod';
export declare const ComplianceDocType: z.ZodEnum<["sfa", "wsq"]>;
export type ComplianceDocType = z.infer<typeof ComplianceDocType>;
export declare const shcComplianceDocSchema: z.ZodObject<{
    id: z.ZodString;
    cook_id: z.ZodString;
    type: z.ZodEnum<["sfa", "wsq"]>;
    file_key: z.ZodString;
    expiry_date: z.ZodOptional<z.ZodString>;
    verified_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    type: "sfa" | "wsq";
    id: string;
    cook_id: string;
    file_key: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    expiry_date?: string | undefined;
    verified_at?: string | undefined;
}, {
    type: "sfa" | "wsq";
    id: string;
    cook_id: string;
    file_key: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    expiry_date?: string | undefined;
    verified_at?: string | undefined;
}>;
export type SHCComplianceDoc = z.infer<typeof shcComplianceDocSchema>;
//# sourceMappingURL=compliance-doc.d.ts.map