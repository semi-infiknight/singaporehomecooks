import { z } from 'zod';

export const shcSavedAddressSchema = z
  .object({
    id: z.string().min(1),
    label: z.enum(['home', 'work', 'other']),
    line1: z.string().min(3),
    line2: z.string().optional(),
    postal_code: z.string().regex(/^\d{6}$/).optional(),
    lat: z.number().min(1.15).max(1.48),
    lng: z.number().min(103.6).max(104.1),
    instructions: z.string().max(500).optional(),
    source: z.enum(['search', 'gps', 'map', 'manual']).optional(),
    created_at: z.string().datetime().optional(),
  })
  .strict();

export type SHCSavedAddress = z.infer<typeof shcSavedAddressSchema>;

export const shcCustomerLocationPrefsSchema = z
  .object({
    active_id: z.string().optional(),
    saved: z.array(shcSavedAddressSchema).max(10),
  })
  .strict();

export type SHCCustomerLocationPrefs = z.infer<typeof shcCustomerLocationPrefsSchema>;