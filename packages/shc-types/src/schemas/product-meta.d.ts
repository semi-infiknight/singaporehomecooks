import { z } from 'zod';
export declare const shcProductMetaSchema: z.ZodObject<{
    product_id: z.ZodString;
    cook_id: z.ZodString;
    cuisine: z.ZodString;
    occasion_tags: z.ZodArray<z.ZodString, "many">;
    allergen_tiers: z.ZodObject<{
        tier1: z.ZodArray<z.ZodString, "many">;
        tier2: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tier3: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tier1: string[];
        tier2?: string[] | undefined;
        tier3?: string[] | undefined;
    }, {
        tier1: string[];
        tier2?: string[] | undefined;
        tier3?: string[] | undefined;
    }>;
    halal: z.ZodBoolean;
    calories: z.ZodOptional<z.ZodNumber>;
    calories_confidence: z.ZodEnum<["full", "category"]>;
    ingredients: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        quantity: number;
        unit: string;
    }, {
        name: string;
        quantity: number;
        unit: string;
    }>, "many">;
    min_qty: z.ZodNumber;
    last_minute_premium_pct: z.ZodOptional<z.ZodNumber>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    product_id: string;
    cook_id: string;
    cuisine: string;
    occasion_tags: string[];
    allergen_tiers: {
        tier1: string[];
        tier2?: string[] | undefined;
        tier3?: string[] | undefined;
    };
    halal: boolean;
    calories_confidence: "full" | "category";
    ingredients: {
        name: string;
        quantity: number;
        unit: string;
    }[];
    min_qty: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    calories?: number | undefined;
    last_minute_premium_pct?: number | undefined;
}, {
    product_id: string;
    cook_id: string;
    cuisine: string;
    occasion_tags: string[];
    allergen_tiers: {
        tier1: string[];
        tier2?: string[] | undefined;
        tier3?: string[] | undefined;
    };
    halal: boolean;
    calories_confidence: "full" | "category";
    ingredients: {
        name: string;
        quantity: number;
        unit: string;
    }[];
    min_qty: number;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    calories?: number | undefined;
    last_minute_premium_pct?: number | undefined;
}>;
export type SHCProductMeta = z.infer<typeof shcProductMetaSchema>;
//# sourceMappingURL=product-meta.d.ts.map