import { Client } from 'minio';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
const useSSL = (process.env.MINIO_USE_SSL || 'false') === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucket = process.env.MINIO_BUCKET || 'shc-images';

export const minioClient = new Client({
  endPoint: endpoint.split(':')[0],
  port: parseInt(endpoint.split(':')[1] || '9000', 10),
  useSSL,
  accessKey,
  secretKey,
});

/**
 * Client used only for browser-facing presigns.
 * Must match MINIO_PUBLIC_URL host so SigV4 Host matches what browsers hit.
 * Falls back to internal client when public URL unset (dev / private only).
 */
function createPublicPresignClient(): Client {
  const publicBase = (process.env.MINIO_PUBLIC_URL || process.env.MINIO_PUBLIC_ENDPOINT || "").trim();
  if (!publicBase) return minioClient;
  try {
    const u = new URL(publicBase.includes("://") ? publicBase : `https://${publicBase}`);
    const port = u.port ? parseInt(u.port, 10) : u.protocol === "https:" ? 443 : 80;
    return new Client({
      endPoint: u.hostname,
      port,
      useSSL: u.protocol === "https:",
      accessKey,
      secretKey,
      // path-style works better behind Railway reverse proxies
      pathStyle: true as any,
    });
  } catch {
    return minioClient;
  }
}

let publicPresignClient: Client | null = null;
function getPublicPresignClient() {
  if (!publicPresignClient) publicPresignClient = createPublicPresignClient();
  return publicPresignClient;
}

export const SHC_BUCKET = bucket;
export const COMPLIANCE_BUCKET = process.env.MINIO_COMPLIANCE_BUCKET || 'cook-certs';

// Hardened: generate presigned for auth'd uploads/downloads
export async function getPresignedUploadUrl(objectName: string, expires = 3600) {
  return getPublicPresignClient().presignedPutObject(SHC_BUCKET, objectName, expires);
}

export async function getPresignedGetUrl(objectName: string, expires = 3600) {
  return getPresignedGetUrlForBucket(SHC_BUCKET, objectName, expires);
}

export async function getPresignedGetUrlForBucket(bucketName: string, objectName: string, expires = 3600) {
  return getPublicPresignClient().presignedGetObject(bucketName, objectName, expires);
}

// Auth hardening helper (to be used in routes with actor)
export function validateUploadActor(actorId: string, resourceOwner?: string) {
  if (resourceOwner && actorId !== resourceOwner) {
    throw new Error('Actor not authorized for this resource');
  }
  return true;
}

export async function ensureBucket(bucketName = SHC_BUCKET) {
  const exists = await minioClient.bucketExists(bucketName).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
  }
}

// Full server-side upload to MinIO (auth on server, can do processing here)
export async function uploadBufferToMinIO(
  objectName: string,
  buffer: Buffer,
  contentType: string = 'image/jpeg',
  bucketName: string = SHC_BUCKET
): Promise<{ key: string; bucket: string; url?: string }> {
  await ensureBucket(bucketName);
  // Write via private network; sign via public host for browser fetch
  await minioClient.putObject(bucketName, objectName, buffer, undefined, {
    'Content-Type': contentType,
  });
  const url = await getPublicPresignClient().presignedGetObject(bucketName, objectName, 3600 * 24 * 7); // 7 days
  return { key: objectName, bucket: bucketName, url };
}