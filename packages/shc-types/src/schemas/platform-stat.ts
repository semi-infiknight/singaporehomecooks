import { z } from 'zod';

// shc_platform_stat exact from blueprint/05-data-model/05-data-model.md
export const shcPlatformStatSchema = z.object({
  key: z.string(),
  value: z.union([z.number(), z.string(), z.record(z.unknown())]), // JSON or primitive
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCPlatformStat = z.infer<typeof shcPlatformStatSchema>;
