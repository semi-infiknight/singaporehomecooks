/** Safe post-login redirect for Expo Router (blocks external URLs). */
export function safeAuthReturnTo(raw?: string | string[]): string | null {
  const path = Array.isArray(raw) ? raw[0] : raw;
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.includes('://')) return null;
  return trimmed;
}

export function authRouteWithReturn(returnTo: string): `/(shared)/auth?returnTo=${string}` {
  return `/(shared)/auth?returnTo=${encodeURIComponent(returnTo)}` as `/(shared)/auth?returnTo=${string}`;
}
