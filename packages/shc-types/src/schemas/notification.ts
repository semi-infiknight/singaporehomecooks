import { z } from 'zod';

export const SHCNotificationType = z.enum([
  'order',
  'credit',
  'request',
  'bid',
  'allergy',
  'reminder',
  'system',
]);

export const shcNotificationSchema = z.object({
  id: z.string(),
  actor_id: z.string(),
  type: SHCNotificationType,
  body: z.string(),
  read: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
}).strict();

export type SHCNotification = z.infer<typeof shcNotificationSchema>;
export type SHCNotificationType = z.infer<typeof SHCNotificationType>;