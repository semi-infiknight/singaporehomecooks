import { z } from 'zod';

// shc_feature_flag exact from blueprint/05-data-model/05-data-model.md
export const shcFeatureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  cohort_filter: z.record(z.unknown()).optional(), // JSON
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCFeatureFlag = z.infer<typeof shcFeatureFlagSchema>;
