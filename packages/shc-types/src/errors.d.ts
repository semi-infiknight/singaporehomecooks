import { z } from 'zod';
export declare const SHCErrorCode: z.ZodEnum<["SHC-AUTH-001", "SHC-ORDER-001", "SHC-ORDER-002", "SHC-ORDER-003", "SHC-ORDER-004", "SHC-CART-001", "SHC-CART-002", "SHC-CART-003", "SHC-PAY-001", "SHC-COMPLIANCE-001", "SHC-COMPLIANCE-002", "SHC-AVAIL-001", "SHC-AVAIL-002", "SHC-DISPUTE-001", "SHC-DISPUTE-002", "SHC-COMMISSION-001", "SHC-PAYOUT-001", "SHC-LEDGER-001", "SHC-REVIEW-001", "SHC-COOK-001", "SHC-PORTIONS-001", "SHC-REQ-001", "SHC-GENERIC-001"]>;
export type SHCErrorCode = z.infer<typeof SHCErrorCode>;
export declare const SHCErrorCodes: Record<SHCErrorCode, string>;
export interface SHCError {
    code: SHCErrorCode;
    message: string;
    details?: Record<string, unknown>;
}
export declare function createSHCError(code: SHCErrorCode, message: string, details?: Record<string, unknown>): SHCError;
export declare function formatError(code: SHCErrorCode, message?: string, details?: Record<string, unknown>): {
    error: SHCError;
};
//# sourceMappingURL=errors.d.ts.map