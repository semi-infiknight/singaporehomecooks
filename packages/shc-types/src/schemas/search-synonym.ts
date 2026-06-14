import { z } from 'zod';

// shc_search_synonym exact from blueprint/05-data-model/05-data-model.md
export const shcSearchSynonymSchema = z.object({
  term: z.string(),
  expansions: z.array(z.string()),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCSearchSynonym = z.infer<typeof shcSearchSynonymSchema>;
