// Canonical exports for Singapore Home Cooks contracts v1 (Contracts Track)
// Full export of all Zod schemas for EVERY table in 05-data-model.md, SHCErrorCode enum + map matching ERROR_CODES.md, status enums.
export * from './schemas';
export * from './errors';

// NOTE: business-rules live in dedicated @shc/business-rules package (Contracts owns both).
// Import schemas/types from '@shc/types'; rule functions from '@shc/business-rules' (depends on this pkg).
