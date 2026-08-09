import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DASHBOARD_SRC = resolve(__dirname, '../../../apps/mobile-cook/app/(cook)/dashboard/index.tsx');
const API_CLIENT_SRC = resolve(__dirname, '../../../apps/mobile-cook/lib/api-client.ts');
const USE_AUTH_SRC = resolve(__dirname, '../../../apps/mobile-cook/hooks/useAuth.ts');

describe('cook app logout UI', () => {
  it('dashboard wires logout control to useAuth and auth navigation', () => {
    const dashboard = readFileSync(DASHBOARD_SRC, 'utf8');
    expect(dashboard).toContain('const { user, logout } = useAuth()');
    expect(dashboard).toContain('await logout()');
    expect(dashboard).toContain("router.replace('/(shared)/auth'");
    expect(dashboard).toContain('testID="logout-btn"');
    expect(dashboard).toMatch(/Logout/);
  });

  it('useAuth logout clears session and nulls user', () => {
    const useAuth = readFileSync(USE_AUTH_SRC, 'utf8');
    expect(useAuth).toMatch(/const logout = useCallback\(async \(\) => \{[\s\S]*?await clearSession\(\)/);
    expect(useAuth).toContain('setUser(null)');
  });

  it('clearSession removes cook token and user from secure storage', () => {
    const api = readFileSync(API_CLIENT_SRC, 'utf8');
    const clearBlock = api.slice(api.indexOf('export async function clearSession'));
    expect(clearBlock).toContain('accessToken = null');
    expect(clearBlock).toContain('client.logout()');
    expect(clearBlock).toContain("deleteItemAsync(TOKEN_KEY)");
    expect(clearBlock).toContain("deleteItemAsync(USER_KEY)");
    expect(api).toContain("const TOKEN_KEY = 'shc_cook_token'");
    expect(api).toContain("const USER_KEY = 'shc_cook_user'");
  });
});