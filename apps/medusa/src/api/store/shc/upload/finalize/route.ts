import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId } from "../../../../../lib/shc-actors";
import { validateUploadActor } from "../../../../../lib/minio-client";
import { finalizeUploadedListingImage } from "../../../../../lib/shc-image-derivatives";
import { logInfo } from "../../../../../lib/shc-observability";

/** POST /store/shc/upload/finalize — after presigned PUT, generate 1200 + 400 WebP derivatives */
const BodySchema = z
  .object({
    object_name: z.string().min(3),
    resource_owner: z.string().optional(),
  })
  .strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid finalize request") });
  }

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const { object_name, resource_owner } = parse.data;
  if (resource_owner) {
    try {
      validateUploadActor(cookId, resource_owner);
    } catch {
      return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Not authorized for this upload") });
    }
  }

  try {
    const result = await finalizeUploadedListingImage(object_name);
    logInfo({
      event: "store.upload.finalize",
      cook_id: cookId,
      object_name,
      thumb_key: result.thumb_key,
      hero_key: result.hero_key,
      request_id: (req as any).request_id,
    });
    return res.json({ success: true, mode: "finalize", ...result });
  } catch (e: any) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Failed to finalize upload"),
    });
  }
}
