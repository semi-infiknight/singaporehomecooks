import { describe, expect, it } from 'vitest';
import {
  cookChatQuickReplies,
  cookComplianceLinks,
  cookDashboardTiles,
  defaultCookPortalConfig,
  normalizeCookPortalConfig,
} from './cook-portal-config';
import { cookPortalGreeting } from './cook-portal';

describe('cook-portal-config', () => {
  it('builds defaults from frozen constants', () => {
    const cfg = defaultCookPortalConfig();
    expect(cfg.dashboard_tiles.length).toBe(6);
    expect(cfg.allergen_tier1_presets).toContain('Shellfish');
    expect(cfg.chat_quick_replies.cook.length).toBeGreaterThan(0);
  });

  it('normalizes admin overrides', () => {
    const cfg = normalizeCookPortalConfig({
      greeting: { morning: 'Hi Chef' },
      chat_quick_replies: { customer: ['Hello'] },
    });
    expect(cfg.greeting.morning).toBe('Hi Chef');
    expect(cfg.chat_quick_replies.customer).toEqual(['Hello']);
  });

  it('filters compliance links by type', () => {
    const cfg = defaultCookPortalConfig();
    const sfa = cookComplianceLinks(cfg, 'sfa');
    expect(sfa.some((l) => l.for === 'wsq' && l.for !== 'both')).toBe(false);
  });

  it('sorts enabled dashboard tiles', () => {
    const cfg = normalizeCookPortalConfig({
      dashboard_tiles: [
        { id: 'a', label: 'A', sort_order: 20, enabled: true },
        { id: 'b', label: 'B', sort_order: 10, enabled: false },
      ],
    });
    const tiles = cookDashboardTiles(cfg);
    expect(tiles[0]?.id).toBe('a');
  });

  it('uses greeting copy from config', () => {
    const cfg = normalizeCookPortalConfig({
      greeting: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    });
    expect(cookPortalGreeting(new Date('2026-07-26T08:00:00'), cfg.greeting)).toBe('Morning');
  });

  it('returns role-specific chat replies', () => {
    const cfg = defaultCookPortalConfig();
    expect(cookChatQuickReplies('cook', cfg).length).toBeGreaterThan(0);
  });
});
