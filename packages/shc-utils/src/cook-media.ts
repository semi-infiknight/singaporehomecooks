/** Cook profile photo upload helpers (avatar + kitchen hero). */

export type CookMediaKind = 'avatar' | 'hero';

export function cookMediaObjectName(cookId: string, kind: CookMediaKind, fileName: string, mimeType: string) {
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('jpeg') || mimeType.includes('jpg')
        ? 'jpg'
        : 'jpg';
  const safeBase = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.[^.]+$/, '') || kind;
  return `cooks/${cookId}/${kind}/${Date.now()}-${safeBase}.${ext}`;
}
