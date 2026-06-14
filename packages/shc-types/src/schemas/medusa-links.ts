import { z } from 'zod';

// Medusa link definitions per 05-data-model.md (Contracts owns)
// These are used for validation of link records / join payloads in modules and API surface.
export const shcCookProductLinkSchema = z.object({
  cook_id: z.string(),
  product_id: z.string(),
  created_at: z.string().datetime().optional(),
}).strict();
export type SHCCookProductLink = z.infer<typeof shcCookProductLinkSchema>;

export const shcCookOrderLinkSchema = z.object({
  cook_id: z.string(),
  order_id: z.string(),
  // one cook per order MVP rule enforced via business-rules
}).strict();
export type SHCCookOrderLink = z.infer<typeof shcCookOrderLinkSchema>;

// Example Medusa extended for payload contracts (future API)
export const shcProductWithMetaSchema = z.object({
  product_id: z.string(),
  // plus native medusa product fields validated at boundary
  shc_meta: z.any(), // use shcProductMetaSchema in practice
}).strict();
