/** Auth hydrate states — never show guest/sign-in UI while `loading`. */

export type AuthSessionState = 'loading' | 'guest' | 'authenticated';

export function resolveAuthSessionState(loading: boolean, user: unknown): AuthSessionState {
  if (loading) return 'loading';
  if (!user) return 'guest';
  return 'authenticated';
}
