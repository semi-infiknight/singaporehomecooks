import { z } from 'zod';
export declare const shcCookProductLinkSchema: z.ZodObject<{
    cook_id: z.ZodString;
    product_id: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    product_id: string;
    cook_id: string;
    created_at?: string | undefined;
}, {
    product_id: string;
    cook_id: string;
    created_at?: string | undefined;
}>;
export type SHCCookProductLink = z.infer<typeof shcCookProductLinkSchema>;
export declare const shcCookOrderLinkSchema: z.ZodObject<{
    cook_id: z.ZodString;
    order_id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    cook_id: string;
    order_id: string;
}, {
    cook_id: string;
    order_id: string;
}>;
export type SHCCookOrderLink = z.infer<typeof shcCookOrderLinkSchema>;
export declare const shcProductWithMetaSchema: z.ZodObject<{
    product_id: z.ZodString;
    shc_meta: z.ZodAny;
}, "strict", z.ZodTypeAny, {
    product_id: string;
    shc_meta?: any;
}, {
    product_id: string;
    shc_meta?: any;
}>;
//# sourceMappingURL=medusa-links.d.ts.map