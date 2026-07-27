import { describe, expect, it } from 'vitest';
import { normalizeCookAreaInput } from './sg-areas';
import {
  haversineDistanceKm,
  isWithinSingapore,
  formatLocationShort,
  distanceToCookAreaKm,
  formatDistanceKm,
  sortByCookProximity,
  requireWithinSingapore,
  savedAddressFromSgArea,
  nudgeCoordinates,
  dragOffsetToCoordinates,
  buildOsmStaticMapUrl,
  buildOsmTileUrl,
  getOsmTileGrid,
} from './location';

describe('location utils', () => {
  it('haversine returns small distance for nearby points', () => {
    const d = haversineDistanceKm({ lat: 1.3521, lng: 103.9448 }, { lat: 1.353, lng: 103.945 });
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(2);
  });

  it('validates Singapore bounds', () => {
    expect(isWithinSingapore(1.3, 103.8)).toBe(true);
    expect(isWithinSingapore(2, 103.8)).toBe(false);
  });

  it('rejects coordinates outside Singapore', () => {
    expect(() => requireWithinSingapore(3.1, 101.7)).toThrow(/Singapore/);
  });

  it('formats short label', () => {
    expect(formatLocationShort({ line1: 'Blk 456 Tampines St 42', postal_code: '520456' })).toContain('520456');
  });

  it('distance to cook area', () => {
    const km = distanceToCookAreaKm({ lat: 1.3521, lng: 103.9448 }, 'Tampines');
    expect(km).not.toBeNull();
    expect(km!).toBeLessThan(5);
  });

  it('formats distance labels', () => {
    expect(formatDistanceKm(0.4)).toBe('< 1 km');
    expect(formatDistanceKm(2.34)).toBe('2.3 km');
    expect(formatDistanceKm(12.8)).toBe('13 km');
    expect(formatDistanceKm(null)).toBeNull();
  });

  it('sorts tiffin kitchens by nested cook.area', () => {
    const sorted = sortByCookProximity(
      [
        { cook: { area: 'Jurong West' } },
        { cook: { area: 'Tampines' } },
      ],
      { lat: 1.3521, lng: 103.9448 }
    );
    expect(sorted[0]?.cook?.area).toBe('Tampines');
  });

  it('normalizes cook area aliases', () => {
    expect(normalizeCookAreaInput('katong')).toBe('Katong / Joo Chiat');
    expect(normalizeCookAreaInput('Tampines')).toBe('Tampines');
  });

  it('builds saved address from SG area centroid', () => {
    const addr = savedAddressFromSgArea({ name: 'Tampines', lat: 1.35, lng: 103.94, postal_prefix: '52' });
    expect(addr.line1).toContain('Tampines');
    expect(addr.lat).toBe(1.35);
  });

  it('nudges coordinates by direction', () => {
    expect(nudgeCoordinates(1.35, 103.82, 'n').lat).toBeGreaterThan(1.35);
    expect(nudgeCoordinates(1.35, 103.82, 'e').lng).toBeGreaterThan(103.82);
  });

  it('converts drag offset to coordinates', () => {
    const next = dragOffsetToCoordinates(1.3521, 103.8198, 40, -30, 360, 240, 17);
    expect(next.lat).toBeGreaterThan(1.3521);
    expect(next.lng).toBeGreaterThan(103.8198);
  });

  it('builds static map url', () => {
    const url = buildOsmStaticMapUrl(1.3521, 103.8198);
    expect(url).toContain('staticmap.openstreetmap.de');
    expect(url).toContain('1.3521');
  });

  it('builds OSM tile grid for map preview', () => {
    expect(buildOsmTileUrl(53397, 34052, 16)).toContain('cartocdn.com/rastertiles/voyager/16/53397/34052');
    expect(getOsmTileGrid(1.3521, 103.8198)).toHaveLength(9);
  });
});