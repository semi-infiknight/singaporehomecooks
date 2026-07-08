import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId } from "../../../../../../lib/shc-actors";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z
  .object({
    display_name: z.string().min(2).max(80).optional(),
    area: z.string().min(2).max(80).optional(),
    story: z.string().max(800).optional(),
    collection_instructions: z.string().max(400).optional(),
    pdpa_consent: z.boolean().optional(),
  })
  .strict();

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

  const data: Record<string, unknown> = { updated_at: new Date() };
  if (parse.data.display_name !== undefined) data.display_name = parse.data.display_name.trim();
  if (parse.data.area !== undefined) data.area = parse.data.area.trim();
  if (parse.data.story !== undefined) data.story = parse.data.story.trim();
  if (parse.data.collection_instructions !== undefined) {
    data.collection_instructions = parse.data.collection_instructions.trim();
  }
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
      ? {
          id: cook.id,
          display_name: cook.display_name,
          area: cook.area,
          story: cook.story,
          collection_instructions: cook.collection_instructions,
          status: cook.status,
        }
      : { id: cookId },
  });
}