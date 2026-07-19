import { COMPLIANCE_BUCKET, SHC_BUCKET, getPresignedGetUrlForBucket } from "./minio-client";

export const COMPLIANCE_PREVIEW_EXPIRES_SEC = 900;

/** Cook compliance uploads use SHC_BUCKET with a compliance/ prefix; legacy keys may live in cook-certs. */
export function resolveComplianceBucket(fileKey: string): string {
  if (fileKey.startsWith("compliance/")) return SHC_BUCKET;
  return COMPLIANCE_BUCKET;
}

export function guessComplianceContentType(fileKey: string): string | undefined {
  const lower = fileKey.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

export async function buildCompliancePreviewUrl(fileKey: string, expires = COMPLIANCE_PREVIEW_EXPIRES_SEC) {
  const bucket = resolveComplianceBucket(fileKey);
  const preview_url = await getPresignedGetUrlForBucket(bucket, fileKey, expires);
  return {
    preview_url,
    bucket,
    expires_in: expires,
    content_type: guessComplianceContentType(fileKey),
  };
}
