import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, requireCustomerId } from "../../../../lib/shc-actors";
import { 
  getPresignedUploadUrl, 
  validateUploadActor, 
  ensureBucket, 
  SHC_BUCKET,
  uploadBufferToMinIO 
} from "../../../../lib/minio-client";

/** POST /store/shc/upload 
 * Supports two modes for full flexibility:
 * 1. Presigned (default): returns URL for client to upload directly (good for large files, less server load)
 * 2. Server: send { object_name, fileData: base64, content_type } - backend uploads to MinIO (full server control, auth, can process)
 */
const BodySchema = z.object({
  object_name: z.string().min(3),
  content_type: z.string().optional(),
  resource_owner: z.string().optional(),
  // For server mode
  fileData: z.string().optional(), // base64 encoded file data
  mode: z.enum(['presigned', 'server']).optional().default('presigned'),
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid upload request") });
  }
  const { object_name, resource_owner, fileData, content_type, mode } = parse.data;

  let actorId: string;
  let actorType: "cook" | "customer";
  try {
    actorId = getCookId(req);
    actorType = "cook";
  } catch {
    try {
      actorId = requireCustomerId(req);
      actorType = "customer";
    } catch {
      return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Auth required for uploads") });
    }
  }

  // Hardening: only cooks for now on most uploads; validate ownership
  if (actorType !== "cook") {
    return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Uploads currently limited to cooks") });
  }
  if (resource_owner) {
    validateUploadActor(actorId, resource_owner);
  }

  await ensureBucket(SHC_BUCKET);

  if (mode === 'server' && fileData) {
    // Full server-side upload to MinIO
    try {
      // Decode base64 (strip data: prefix if present)
      const base64Data = fileData.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ct = content_type || 'image/jpeg';
      const result = await uploadBufferToMinIO(object_name, buffer, ct);
      return res.json({
        success: true,
        mode: 'server',
        key: result.key,
        bucket: result.bucket,
        url: result.url, // signed get URL
        // In production, you might store the key and generate signed on demand
      });
    } catch (e: any) {
      return res.status(500).json({ error: createSHCError("SHC-GENERIC-001", `Server upload failed: ${e.message}`) });
    }
  }

  // Default: presigned URL for client direct upload
  const url = await getPresignedUploadUrl(object_name);

  res.json({
    upload_url: url,
    object_name,
    bucket: SHC_BUCKET,
    mode: 'presigned',
    // client should PUT the file to this url with correct content-type
  });
}