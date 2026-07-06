import { afterEach, describe, expect, it, vi } from 'vitest';

describe('build-fingerprint', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('reads .railway-build-id and adds header', async () => {
    vi.doMock('node:fs', () => ({
      readFileSync: vi.fn(() => 'goal-pwa-test-fingerprint\n'),
    }));

    const { getRailwayBuildId, withRailwayBuildId, RAILWAY_BUILD_ID_HEADER } = await import(
      './build-fingerprint'
    );

    expect(getRailwayBuildId()).toBe('goal-pwa-test-fingerprint');
    expect(withRailwayBuildId({ 'Cache-Control': 'public' })).toEqual({
      'Cache-Control': 'public',
      [RAILWAY_BUILD_ID_HEADER]: 'goal-pwa-test-fingerprint',
    });
  });

  it('returns unknown when .railway-build-id is missing', async () => {
    vi.doMock('node:fs', () => ({
      readFileSync: vi.fn(() => {
        throw new Error('ENOENT');
      }),
    }));

    const { getRailwayBuildId } = await import('./build-fingerprint');
    expect(getRailwayBuildId()).toBe('unknown');
  });
});