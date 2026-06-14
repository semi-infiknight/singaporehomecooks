import { z } from 'zod';
export declare const BidStatus: z.ZodEnum<["pending", "accepted", "rejected"]>;
export type BidStatus = z.infer<typeof BidStatus>;
export declare const shcBidSchema: z.ZodObject<{
    id: z.ZodString;
    request_id: z.ZodString;
    cook_id: z.ZodString;
    price_cents: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "accepted", "rejected"]>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    cook_id: string;
    request_id: string;
    price_cents: number;
    message?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    status: "pending" | "accepted" | "rejected";
    id: string;
    cook_id: string;
    request_id: string;
    price_cents: number;
    message?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type SHCBid = z.infer<typeof shcBidSchema>;
//# sourceMappingURL=bid.d.ts.map