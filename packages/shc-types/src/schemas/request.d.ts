import { z } from 'zod';
export declare const RequestStatus: z.ZodEnum<["open", "bidding", "matched", "closed"]>;
export type RequestStatus = z.infer<typeof RequestStatus>;
export declare const shcRequestSchema: z.ZodObject<{
    id: z.ZodString;
    customer_id: z.ZodString;
    body: z.ZodString;
    youtube_url: z.ZodOptional<z.ZodString>;
    party_size: z.ZodOptional<z.ZodNumber>;
    budget_cents: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["open", "bidding", "matched", "closed"]>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    status: "open" | "bidding" | "matched" | "closed";
    id: string;
    body: string;
    customer_id: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    date?: string | undefined;
    youtube_url?: string | undefined;
    party_size?: number | undefined;
    budget_cents?: number | undefined;
}, {
    status: "open" | "bidding" | "matched" | "closed";
    id: string;
    body: string;
    customer_id: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    date?: string | undefined;
    youtube_url?: string | undefined;
    party_size?: number | undefined;
    budget_cents?: number | undefined;
}>;
export type SHCRequest = z.infer<typeof shcRequestSchema>;
//# sourceMappingURL=request.d.ts.map