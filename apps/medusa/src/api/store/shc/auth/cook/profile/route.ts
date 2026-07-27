import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
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
    availability_paused: z.boolean().optional(),
    avatar_url: z.string().max(500).optional(),
    hero_image_url: z.string().max(500).optional(),
    pdpa_consent: z.boolean().optional(),
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
    cook: await shapeCookForStore({
      ...shapeCookProfile(cook),
      id: cook.id,
      slug: cook.slug,
    }),
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
  if (parse.data.area !== undefined) data.area = parse.data.area.trim();
  if (parse.data.story !== undefined) data.story = parse.data.story.trim();
  if (parse.data.collection_address !== undefined) {
    data.collection_address = parse.data.collection_address.trim();
  }
  if (parse.data.collection_instructions !== undefined) {
    data.collection_instructions = parse.data.collection_instructions.trim();
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

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  await cookService.updateCooks({ selector: { id: cookId }, data: data as any });
  const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (rows as any[])?.[0];

  return res.json({
    cook: cook
      ? await shapeCookForStore({
          ...shapeCookProfile(cook),
          id: cook.id,
          slug: cook.slug,
        })
      : { id: cookId },
  });
}
