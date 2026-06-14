import { z } from 'zod';
export declare const shcAvailabilitySchema: z.ZodObject<{
    product_id: z.ZodString;
    portions_per_day: z.ZodNumber;
    collection_days: z.ZodArray<z.ZodNumber, "many">;
    time_slots: z.ZodArray<z.ZodString, "many">;
    paused: z.ZodBoolean;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    paused: boolean;
    product_id: string;
    portions_per_day: number;
    collection_days: number[];
    time_slots: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    paused: boolean;
    product_id: string;
    portions_per_day: number;
    collection_days: number[];
    time_slots: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type SHCAvailability = z.infer<typeof shcAvailabilitySchema>;
export declare const portionsCheckInputSchema: z.ZodObject<{
    product_id: z.ZodString;
    requested_qty: z.ZodNumber;
    collection_date: z.ZodString;
}, "strict", z.ZodTypeAny, {
    product_id: string;
    collection_date: string;
    requested_qty: number;
}, {
    product_id: string;
    collection_date: string;
    requested_qty: number;
}>;
export type PortionsCheckInput = z.infer<typeof portionsCheckInputSchema>;
//# sourceMappingURL=availability.d.ts.map