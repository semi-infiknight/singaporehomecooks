import { z } from 'zod';

// shc_compliance_doc exact from blueprint/05-data-model/05-data-model.md
export const ComplianceDocType = z.enum(['sfa', 'wsq']);
export type ComplianceDocType = z.infer<typeof ComplianceDocType>;

export const shcComplianceDocSchema = z.object({
  id: z.string(),
  cook_id: z.string(),
  type: ComplianceDocType,
  file_key: z.string(), // MinIO key
  expiry_date: z.string().datetime().optional(),
  verified_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCComplianceDoc = z.infer<typeof shcComplianceDocSchema>;
