import { z } from 'zod';
import { SHCErrorCode } from '../errors';
export declare const SHCOrderStatus: z.ZodEnum<["cart", "paid", "accepted", "preparing", "ready_for_collection", "collected", "completed", "cancelled", "disputed", "resolved"]>;
export type SHCOrderStatus = z.infer<typeof SHCOrderStatus>;
export declare const shcOrderMetaSchema: z.ZodObject<{
    order_id: z.ZodString;
    cook_id: z.ZodString;
    collection_date: z.ZodString;
    collection_slot: z.ZodString;
    allergen_acked_at: z.ZodOptional<z.ZodString>;
    address_released_at: z.ZodOptional<z.ZodString>;
    paynow_reference: z.ZodOptional<z.ZodString>;
    shc_status: z.ZodEnum<["cart", "paid", "accepted", "preparing", "ready_for_collection", "collected", "completed", "cancelled", "disputed", "resolved"]>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    cook_id: string;
    order_id: string;
    collection_date: string;
    collection_slot: string;
    shc_status: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    created_at?: string | undefined;
    updated_at?: string | undefined;
    allergen_acked_at?: string | undefined;
    address_released_at?: string | undefined;
    paynow_reference?: string | undefined;
}, {
    cook_id: string;
    order_id: string;
    collection_date: string;
    collection_slot: string;
    shc_status: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    created_at?: string | undefined;
    updated_at?: string | undefined;
    allergen_acked_at?: string | undefined;
    address_released_at?: string | undefined;
    paynow_reference?: string | undefined;
}>;
export type SHCOrderMeta = z.infer<typeof shcOrderMetaSchema>;
export declare const orderStateTransitionSchema: z.ZodEffects<z.ZodObject<{
    from: z.ZodEnum<["cart", "paid", "accepted", "preparing", "ready_for_collection", "collected", "completed", "cancelled", "disputed", "resolved"]>;
    to: z.ZodEnum<["cart", "paid", "accepted", "preparing", "ready_for_collection", "collected", "completed", "cancelled", "disputed", "resolved"]>;
}, "strip", z.ZodTypeAny, {
    from: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    to: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
}, {
    from: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    to: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
}>, {
    from: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    to: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
}, {
    from: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
    to: "cart" | "paid" | "accepted" | "preparing" | "ready_for_collection" | "collected" | "completed" | "cancelled" | "disputed" | "resolved";
}>;
export type OrderStateTransition = z.infer<typeof orderStateTransitionSchema>;
export declare function validateOrderTransition(from: SHCOrderStatus, to: SHCOrderStatus): {
    valid: boolean;
    error?: SHCErrorCode;
};
//# sourceMappingURL=order.d.ts.map