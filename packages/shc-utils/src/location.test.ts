import { describe, expect, it } from 'vitest';
import {
  haversineDistanceKm,
  isWithinSingapore,
  formatLocationShort,
  distanceToCookAreaKm,
  nudgeCoordinates,
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

  it('formats short label', () => {
    expect(formatLocationShort({ line1: 'Blk 456 Tampines St 42', postal_code: '520456' })).toContain('520456');
  });

  it('distance to cook area', () => {
    const km = distanceToCookAreaKm({ lat: 1.3521, lng: 103.9448 }, 'Tampines');
    expect(km).not.toBeNull();
    expect(km!).toBeLessThan(5);
  });

  it('nudges coordinates by direction', () => {
    expect(nudgeCoordinates(1.35, 103.82, 'n').lat).toBeGreaterThan(1.35);
    expect(nudgeCoordinates(1.35, 103.82, 'e').lng).toBeGreaterThan(103.82);
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