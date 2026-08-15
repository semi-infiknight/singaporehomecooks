import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizeCookCollectionTimeSlots, normalizeCookAreaInput, normalizePaynowMobile, normalizePaynowUen } from "@shc/utils";
import { getCookId } from "../../../../../../lib/shc-actors";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";
import { assertCookOwnsMediaKey, shapeCookForStore, type CookMediaRow } from "../../../../../../lib/shc-cook-shape";

const BodySchema = z
  .object({
    display_name: z.string().min(2).max(80).optional(),
    area: z.string().min(2).max(80).optional(),
    story: z.string().max(800).optional(),
    collection_address: z.string().max(200).optional(),
    collection_instructions: z.string().max(400).optional(),
    collection_time_slots: z.array(z.string().min(1).max(40)).max(12).optional(),
    availability_paused: z.boolean().optional(),
    avatar_url: z.string().max(500).optional(),
    hero_image_url: z.string().max(500).optional(),
    pdpa_consent: z.boolean().optional(),
    paynow_mobile: z.string().max(20).optional(),
    paynow_uen: z.string().max(20).optional(),
    payout_legal_name: z.string().max(120).optional(),
    contact_mobile: z.string().max(20).optional(),
    whatsapp_number: z.string().max(20).optional(),
    responsible_person_name: z.string().max(120).optional(),
    nric_fin_last4: z.string().max(8).optional(),
    alternate_contact: z.string().max(40).optional(),
    kitchen_halal_certified: z.boolean().nullable().optional(),
    terms_consent: z.boolean().optional(),
    onboarding_completed_at: z.string().datetime().optional(),
  })
  .strict();

export function shapeCookProfile(cook: Record<string, unknown>): CookMediaRow {
  return {
    id: cook.id as string | undefined,
    display_name: cook.display_name as string | undefined,
    area: cook.area as string | undefined,
    story: cook.story as string | null | undefined,
    collection_address: cook.collection_address as string | null | undefined,
  collection_instructions: cook.collection_instructions as string | null | undefined,
  collection_time_slots: normalizeCookCollectionTimeSlots(cook.collection_time_slots),
  avatar_url: cook.avatar_url as string | null | undefined,
    hero_image_url: cook.hero_image_url as string | null | undefined,
    status: cook.status as string | undefined,
    availability_paused: Boolean(cook.availability_paused),
    slug: cook.slug as string | undefined,
  };
}

/** GET /store/shc/auth/cook/profile — current cook kitchen profile */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (rows as any[])?.[0];
  if (!cook) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Cook not found") });
  }

  return res.json({
    cook: {
      ...(await shapeCookForStore({
        ...shapeCookProfile(cook),
        id: cook.id,
        slug: cook.slug,
      })),
      paynow_mobile: cook.paynow_mobile ?? null,
      paynow_uen: cook.paynow_uen ?? null,
      payout_legal_name: cook.payout_legal_name ?? null,
      onboarding_completed_at: cook.onboarding_completed_at ?? null,
      email_verified_at: cook.email_verified_at ?? null,
      mobile_verified_at: cook.mobile_verified_at ?? null,
      contact_mobile: cook.contact_mobile ?? null,
      whatsapp_number: cook.whatsapp_number ?? null,
      alternate_contact: cook.alternate_contact ?? null,
      responsible_person_name: cook.responsible_person_name ?? null,
      nric_fin_last4: cook.nric_fin_last4 ?? null,
      kitchen_halal_certified:
        cook.kitchen_halal_certified === null || cook.kitchen_halal_certified === undefined
          ? null
          : Boolean(cook.kitchen_halal_certified),
    },
  });
}

/** PATCH /store/shc/auth/cook/profile — cook onboarding / profile updates */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid profile payload") });
  }

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  try {
    if (parse.data.avatar_url !== undefined) {
      assertCookOwnsMediaKey(cookId, parse.data.avatar_url);
    }
    if (parse.data.hero_image_url !== undefined) {
      assertCookOwnsMediaKey(cookId, parse.data.hero_image_url);
    }
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Invalid media key") });
  }

  const data: Record<string, unknown> = { updated_at: new Date() };
  if (parse.data.display_name !== undefined) data.display_name = parse.data.display_name.trim();
  if (parse.data.area !== undefined) data.area = normalizeCookAreaInput(parse.data.area);
  if (parse.data.story !== undefined) data.story = parse.data.story.trim();
  if (parse.data.collection_address !== undefined) {
    data.collection_address = parse.data.collection_address.trim();
  }
  if (parse.data.collection_instructions !== undefined) {
    data.collection_instructions = parse.data.collection_instructions.trim();
  }
  if (parse.data.collection_time_slots !== undefined) {
    data.collection_time_slots = normalizeCookCollectionTimeSlots(parse.data.collection_time_slots);
  }
  if (parse.data.availability_paused !== undefined) {
    data.availability_paused = parse.data.availability_paused;
  }
  if (parse.data.avatar_url !== undefined) data.avatar_url = parse.data.avatar_url.trim();
  if (parse.data.hero_image_url !== undefined) data.hero_image_url = parse.data.hero_image_url.trim();
  if (parse.data.pdpa_consent === true) {
    data.pdpa_consent_at = new Date().toISOString();
    data.pdpa_consent_version = "2026-07";
  }
  if (parse.data.paynow_mobile !== undefined) {
    data.paynow_mobile = normalizePaynowMobile(parse.data.paynow_mobile);
  }
  if (parse.data.paynow_uen !== undefined) {
    data.paynow_uen = normalizePaynowUen(parse.data.paynow_uen);
  }
  if (parse.data.payout_legal_name !== undefined) {
    data.payout_legal_name = parse.data.payout_legal_name.trim() || null;
  }
  if (parse.data.contact_mobile !== undefined) {
    data.contact_mobile = normalizePaynowMobile(parse.data.contact_mobile);
  }
  if (parse.data.whatsapp_number !== undefined) {
    data.whatsapp_number = normalizePaynowMobile(parse.data.whatsapp_number);
  }
  if (parse.data.responsible_person_name !== undefined) {
    data.responsible_person_name = parse.data.responsible_person_name.trim() || null;
  }
  if (parse.data.nric_fin_last4 !== undefined) {
    data.nric_fin_last4 = parse.data.nric_fin_last4.trim().toUpperCase() || null;
  }
  if (parse.data.alternate_contact !== undefined) {
    data.alternate_contact = parse.data.alternate_contact.trim() || null;
  }
  if (parse.data.kitchen_halal_certified !== undefined) {
    data.kitchen_halal_certified = parse.data.kitchen_halal_certified;
  }
  if (parse.data.terms_consent === true) {
    data.terms_accepted_at = new Date().toISOString();
    data.terms_version = "2026-07";
  }
  if (parse.data.onboarding_completed_at !== undefined) {
    data.onboarding_completed_at = parse.data.onboarding_completed_at;
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  await cookService.updateCooks({ selector: { id: cookId }, data: data as any });
  const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (rows as any[])?.[0];

  return res.json({
    cook: cook
      ? {
          ...(await shapeCookForStore({
            ...shapeCookProfile(cook),
            id: cook.id,
            slug: cook.slug,
          })),
          paynow_mobile: cook.paynow_mobile ?? null,
          paynow_uen: cook.paynow_uen ?? null,
          payout_legal_name: cook.payout_legal_name ?? null,
        }
      : { id: cookId },
  });
}
