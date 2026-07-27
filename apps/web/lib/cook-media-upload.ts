import { cookMediaObjectName, type CookMediaKind } from '@shc/utils';

export async function uploadCookMediaFile(
  upload: (
    imageBase64: string,
    objectName: string,
    cookId: string,
    contentType?: string
  ) => Promise<{ key?: string; url?: string }>,
  input: {
    cookId: string;
    kind: CookMediaKind;
    base64: string;
    mimeType: string;
    fileName: string;
  }
) {
  const objectName = cookMediaObjectName(input.cookId, input.kind, input.fileName, input.mimeType);
  const uploaded = await upload(input.base64, objectName, input.cookId, input.mimeType);
  const key = String(uploaded.key || objectName);
  return { key, url: uploaded.url };
}

export async function readWebImageFile(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  const mimeType = file.type || 'image/jpeg';
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return {
    base64: `data:${mimeType};base64,${btoa(binary)}`,
    mimeType,
    fileName: file.name || `${Date.now()}.jpg`,
  };
}
