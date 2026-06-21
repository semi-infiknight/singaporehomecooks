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

export const SHC_BUCKET = bucket;
export const COMPLIANCE_BUCKET = process.env.MINIO_COMPLIANCE_BUCKET || 'cook-certs';

// Hardened: generate presigned for auth'd uploads/downloads
export async function getPresignedUploadUrl(objectName: string, expires = 3600) {
  return minioClient.presignedPutObject(SHC_BUCKET, objectName, expires);
}

export async function getPresignedGetUrl(objectName: string, expires = 3600) {
  return minioClient.presignedGetObject(SHC_BUCKET, objectName, expires);
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
  await minioClient.putObject(bucketName, objectName, buffer, undefined, {
    'Content-Type': contentType,
  });
  // Return a short-lived signed URL for immediate use (or store key and generate later)
  const url = await minioClient.presignedGetObject(bucketName, objectName, 3600 * 24 * 7); // 7 days
  return { key: objectName, bucket: bucketName, url };
}