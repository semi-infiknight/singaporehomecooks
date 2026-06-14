import { z } from 'zod';

// shc_commission_rule exact from blueprint/05-data-model/05-data-model.md + GST/locked 15% default
export const shcCommissionRuleSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  rate_pct: z.number().min(0).max(100),
  effective_from: z.string().datetime(),
  gst_rate: z.number().min(0).max(100).optional(),
  created_by: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCCommissionRule = z.infer<typeof shcCommissionRuleSchema>;
