import { z } from 'zod';
export declare const DisputeType: z.ZodEnum<["customer_complaint", "cook_cancelled_late", "quality", "other"]>;
export type DisputeType = z.infer<typeof DisputeType>;
export declare const DisputeStatus: z.ZodEnum<["open", "resolved", "cancelled"]>;
export type DisputeStatus = z.infer<typeof DisputeStatus>;
export declare const shcDisputeSchema: z.ZodObject<{
    id: z.ZodString;
    order_id: z.ZodString;
    raised_by: z.ZodEnum<["customer", "cook", "ops"]>;
    type: z.ZodEnum<["customer_complaint", "cook_cancelled_late", "quality", "other"]>;
    status: z.ZodEnum<["open", "resolved", "cancelled"]>;
    notes: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    type: "customer_complaint" | "cook_cancelled_late" | "quality" | "other";
    status: "cancelled" | "resolved" | "open";
    id: string;
    order_id: string;
    raised_by: "customer" | "cook" | "ops";
    created_at?: string | undefined;
    updated_at?: string | undefined;
    notes?: string | undefined;
    resolution?: string | undefined;
}, {
    type: "customer_complaint" | "cook_cancelled_late" | "quality" | "other";
    status: "cancelled" | "resolved" | "open";
    id: string;
    order_id: string;
    raised_by: "customer" | "cook" | "ops";
    created_at?: string | undefined;
    updated_at?: string | undefined;
    notes?: string | undefined;
    resolution?: string | undefined;
}>;
export type SHCDispute = z.infer<typeof shcDisputeSchema>;
//# sourceMappingURL=dispute.d.ts.map