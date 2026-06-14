import { z } from 'zod';
export declare const shcReviewSchema: z.ZodObject<{
    id: z.ZodString;
    order_id: z.ZodString;
    cook_id: z.ZodString;
    customer_id: z.ZodString;
    rating: z.ZodNumber;
    body: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    cook_id: string;
    order_id: string;
    customer_id: string;
    rating: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    body?: string | undefined;
}, {
    id: string;
    cook_id: string;
    order_id: string;
    customer_id: string;
    rating: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    body?: string | undefined;
}>;
export type SHCReview = z.infer<typeof shcReviewSchema>;
//# sourceMappingURL=review.d.ts.map