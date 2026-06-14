import { z } from 'zod';

// Exact fields from blueprint/05-data-model/05-data-model.md (Contracts Track owns; .strict())
export const CookStatus = z.enum(['pending', 'active', 'paused', 'suspended']);
export type CookStatus = z.infer<typeof CookStatus>;

export const shcCookSchema = z.object({
  id: z.string(),
  auth_identity_id: z.string(),
  slug: z.string(),
  display_name: z.string(),
  story: z.string().optional(),
  area: z.string(),
  collection_address: z.string().optional(),
  collection_instructions: z.string().optional(),
  status: CookStatus,
  availability_paused: z.boolean().default(false),
  expo_push_token: z.string().optional(),
  sfa_reg_number: z.string().optional(),
  wsq_cert_expiry: z.string().datetime().optional(),
  pdpa_consent_at: z.string().datetime().optional(),
  pdpa_consent_version: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCCook = z.infer<typeof shcCookSchema>;
