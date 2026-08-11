import { z } from 'zod';

export const shcSavedAddressSchema = z
  .object({
    id: z.string().min(1),
    /** Free-text or emoji tag (e.g. 🏠) — not home|work|other. */
    label: z.string().min(1).max(40),
    line1: z.string().min(3),
    line2: z.string().optional(),
    postal_code: z
      .string()
      .optional()
      .transform((v) => {
        const s = (v || '').trim();
        return /^\d{6}$/.test(s) ? s : undefined;
      }),
    lat: z.number().min(1.15).max(1.48),
    lng: z.number().min(103.6).max(104.1),
    instructions: z.string().max(500).optional(),
    source: z.enum(['search', 'gps', 'map', 'manual']).optional(),
    created_at: z.string().optional(),
  })
  .strict();

export type SHCSavedAddress = z.infer<typeof shcSavedAddressSchema>;

/**
 * Device GPS / “near me” for discover proximity only — never a collection HDB point.
 * Collection addresses live in `saved` + `active_id`.
 */
export const shcBrowseProximitySchema = z
  .object({
    lat: z.number().min(1.15).max(1.48),
    lng: z.number().min(103.6).max(104.1),
    /** Soft label for header, e.g. neighbourhood from reverse geocode */
    area_label: z.string().max(80).optional(),
    updated_at: z.string().optional(),
  })
  .strict();

export type SHCBrowseProximity = z.infer<typeof shcBrowseProximitySchema>;

export const shcCustomerLocationPrefsSchema = z
  .object({
    active_id: z.string().optional(),
    saved: z.array(shcSavedAddressSchema).max(10),
    /** Browse-only coords — not used as checkout collection address */
    browse_proximity: shcBrowseProximitySchema.optional(),
  })
  .strict();

export type SHCCustomerLocationPrefs = z.infer<typeof shcCustomerLocationPrefsSchema>;