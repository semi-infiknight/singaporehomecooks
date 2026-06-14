import { z } from 'zod';
export declare const SenderActor: z.ZodEnum<["customer", "cook", "ops"]>;
export type SenderActor = z.infer<typeof SenderActor>;
export declare const shcOrderMessageSchema: z.ZodObject<{
    id: z.ZodString;
    order_id: z.ZodString;
    sender_actor: z.ZodEnum<["customer", "cook", "ops"]>;
    sender_id: z.ZodString;
    body: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    order_id: string;
    sender_actor: "customer" | "cook" | "ops";
    sender_id: string;
    body: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    id: string;
    order_id: string;
    sender_actor: "customer" | "cook" | "ops";
    sender_id: string;
    body: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type SHCOrderMessage = z.infer<typeof shcOrderMessageSchema>;
//# sourceMappingURL=order-message.d.ts.map