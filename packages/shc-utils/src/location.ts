import type { SHCSavedAddress } from '@shc/types';
import { getAreaCentroid, searchLocalSgAreas, SG_AREA_CENTROIDS, type SgAreaEntry } from './sg-areas';

export type AddressSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  line1: string;
  postal_code?: string;
  lat: number;
  lng: number;
  source: 'onemap' | 'local';
};

export const SG_BOUNDS = {
  minLat: 1.15,
  maxLat: 1.48,
  minLng: 103.6,
  maxLng: 104.1,
} as const;

export function isWithinSingapore(lat: number, lng: number): boolean {
  return lat >= SG_BOUNDS.minLat && lat <= SG_BOUNDS.maxLat && lng >= SG_BOUNDS.minLng && lng <= SG_BOUNDS.maxLng;
}

/** Haversine distance in km */
export function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatLocationLabel(addr: Pick<SHCSavedAddress, 'line1' | 'postal_code' | 'line2'>): string {
  const parts = [addr.line1];
  if (addr.line2) parts.push(addr.line2);
  if (addr.postal_code) parts.push(`S${addr.postal_code}`);
  return parts.join(', ');
}

export function formatLocationShort(addr: Pick<SHCSavedAddress, 'line1' | 'postal_code'>): string {
  const base = addr.line1.length > 32 ? `${addr.line1.slice(0, 30)}…` : addr.line1;
  return addr.postal_code ? `${base} · S${addr.postal_code}` : base;
}

function mapOneMapResult(r: Record<string, unknown>, index: number): AddressSearchResult | null {
  const lat = parseFloat(String(r.LATITUDE ?? ''));
  const lng = parseFloat(String(r.LONGITUDE ?? ''));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isWithinSingapore(lat, lng)) return null;
  const blk = String(r.BLK_NO ?? '').trim();
  const road = String(r.ROAD_NAME ?? r.SEARCHVAL ?? '').trim();
  const building = String(r.BUILDINGNAME ?? '').trim();
  const postal = String(r.POSTAL ?? '').trim();
  const line1 = [blk && `Blk ${blk}`, road, building].filter(Boolean).join(' ') || String(r.ADDRESS ?? r.SEARCHVAL ?? 'Singapore');
  return {
    id: `onemap-${index}-${postal || lat}`,
    title: building || road || line1,
    subtitle: [line1, postal && `S${postal}`].filter(Boolean).join(' · '),
    line1,
    postal_code: /^\d{6}$/.test(postal) ? postal : undefined,
    lat,
    lng,
    source: 'onemap',
  };
}

function mapLocalArea(a: SgAreaEntry): AddressSearchResult {
  return {
    id: `local-${a.name}`,
    title: a.name,
    subtitle: `Singapore · near postal ${a.postal_prefix ?? '—'}xx`,
    line1: `${a.name}, Singapore`,
    postal_code: a.postal_prefix ? `${a.postal_prefix}0000`.slice(0, 6) : undefined,
    lat: a.lat,
    lng: a.lng,
    source: 'local',
  };
}

/** Search Singapore addresses — OneMap elastic search with offline area fallback. */
export async function searchSingaporeAddresses(query: string, limit = 8): Promise<AddressSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as { results?: Record<string, unknown>[] };
      const mapped = (data.results ?? [])
        .map((r, i) => mapOneMapResult(r, i))
        .filter((x): x is AddressSearchResult => !!x)
        .slice(0, limit);
      if (mapped.length > 0) return mapped;
    }
  } catch {
    /* fallback */
  }

  return searchLocalSgAreas(q, limit).map(mapLocalArea);
}

/** Reverse geocode via OneMap; falls back to nearest SG area name. */
export async function reverseGeocodeSingapore(lat: number, lng: number): Promise<AddressSearchResult> {
  if (!isWithinSingapore(lat, lng)) {
    throw new Error('Pin must be within Singapore');
  }

  try {
    const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&buffer=40&addressType=All`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as { GeocodeInfo?: Record<string, unknown>[] };
      const info = data.GeocodeInfo?.[0];
      if (info) {
        const mapped = mapOneMapResult(
          {
            LATITUDE: lat,
            LONGITUDE: lng,
            BLK_NO: info.BLK_NO,
            ROAD_NAME: info.ROAD,
            BUILDINGNAME: info.BUILDINGNAME,
            POSTAL: info.POSTALCODE,
            ADDRESS: info.BLOCK ?? info.ROAD,
            SEARCHVAL: info.ROAD,
          },
          0
        );
        if (mapped) return mapped;
      }
    }
  } catch {
    /* fallback */
  }

  let nearest = SG_AREA_CENTROIDS[0];
  let bestKm = Infinity;
  for (const a of SG_AREA_CENTROIDS) {
    const d = haversineDistanceKm({ lat, lng }, a);
    if (d < bestKm) {
      bestKm = d;
      nearest = a;
    }
  }
  return {
    id: `rev-${lat}-${lng}`,
    title: nearest?.name ?? 'Selected pin',
    subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    line1: nearest ? `${nearest.name}, Singapore` : 'Selected location, Singapore',
    lat,
    lng,
    source: 'local',
  };
}

export function distanceToCookAreaKm(
  customer: { lat: number; lng: number },
  cookArea: string
): number | null {
  const centroid = getAreaCentroid(cookArea);
  if (!centroid) return null;
  return haversineDistanceKm(customer, centroid);
}

export function sortByCookProximity<T extends { cook_area?: string; area?: string }>(
  items: T[],
  customer: { lat: number; lng: number } | null | undefined
): T[] {
  if (!customer) return items;
  return [...items].sort((a, b) => {
    const da = distanceToCookAreaKm(customer, a.cook_area ?? a.area ?? '') ?? 999;
    const db = distanceToCookAreaKm(customer, b.cook_area ?? b.area ?? '') ?? 999;
    return da - db;
  });
}

/** Web mercator tile index for a lat/lng at a given zoom. */
export function osmTileAt(lat: number, lng: number, zoom: number): { x: number; y: number; zoom: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, zoom };
}

/** Carto Voyager tiles (OSM-derived; mobile-friendly vs direct OSM tile servers). */
export function buildOsmTileUrl(x: number, y: number, zoom: number): string {
  return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
}

/** 3×3 OSM tile URLs centered on lat/lng — used for mobile map preview (no WebView). */
export function getOsmTileGrid(lat: number, lng: number, zoom = 17): string[] {
  const { x: cx, y: cy } = osmTileAt(lat, lng, zoom);
  const urls: string[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      urls.push(buildOsmTileUrl(cx + dx, cy + dy, zoom));
    }
  }
  return urls;
}

/** Static OSM preview image (mobile Image / fallback). */
export function buildOsmStaticMapUrl(
  lat: number,
  lng: number,
  width = 600,
  height = 440,
  zoom = 16
): string {
  const size = `${width}x${height}`;
  const center = `${lat},${lng}`;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=${zoom}&size=${size}&markers=${center},red`;
}

export type MapNudgeDirection = 'n' | 's' | 'e' | 'w';

const TILE_PX = 256;

/** Meters per pixel for 256px Web Mercator tiles at a given latitude. */
export function metersPerPixelAt(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/** Convert finger drag (px) on a tile-grid map preview to new lat/lng. */
export function dragOffsetToCoordinates(
  lat: number,
  lng: number,
  dx: number,
  dy: number,
  viewWidth: number,
  viewHeight: number,
  zoom = 17,
  tileCount = 3,
): { lat: number; lng: number } {
  const mpp = metersPerPixelAt(lat, zoom);
  const geoWidthM = tileCount * TILE_PX * mpp;
  const geoHeightM = tileCount * TILE_PX * mpp;
  const metersX = (dx / viewWidth) * geoWidthM;
  const metersY = (dy / viewHeight) * geoHeightM;
  const dLng = metersX / (111320 * Math.cos((lat * Math.PI) / 180));
  const dLat = -metersY / 110540;
  return {
    lat: Math.min(SG_BOUNDS.maxLat, Math.max(SG_BOUNDS.minLat, lat + dLat)),
    lng: Math.min(SG_BOUNDS.maxLng, Math.max(SG_BOUNDS.minLng, lng + dLng)),
  };
}

/** Move map pin by ~15–20 m per step at zoom 16. */
export function nudgeCoordinates(
  lat: number,
  lng: number,
  direction: MapNudgeDirection,
  step = 0.00015
): { lat: number; lng: number } {
  switch (direction) {
    case 'n':
      return { lat: lat + step, lng };
    case 's':
      return { lat: lat - step, lng };
    case 'e':
      return { lat, lng: lng + step };
    case 'w':
      return { lat, lng: lng - step };
    default:
      return { lat, lng };
  }
}

/** Leaflet map HTML for WebView / iframe (pin drag + tap). */
export function buildOsmMapPickerHtml(lat: number, lng: number, zoom = 16): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%;width:100%;} .leaflet-container{background:#e8e0d5;}</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(map);
  var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
  function send() {
    var p = marker.getLatLng();
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', lat: p.lat, lng: p.lng }));
    } else if (window.parent !== window) {
      window.parent.postMessage({ type: 'shc-map-pin', lat: p.lat, lng: p.lng }, '*');
    }
  }
  marker.on('dragend', send);
  map.on('click', function(e) { marker.setLatLng(e.latlng); send(); });
  send();
</script></body></html>`;
}

export function createSavedAddress(
  partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }
): SHCSavedAddress {
  return {
    ...partial,
    id: partial.id ?? `addr_${Date.now().toString(36)}`,
    created_at: new Date().toISOString(),
  };
}