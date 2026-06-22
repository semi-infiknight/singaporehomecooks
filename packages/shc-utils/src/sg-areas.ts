/** Singapore area centroids for proximity + offline search fallback. */

export type SgAreaEntry = {
  name: string;
  lat: number;
  lng: number;
  postal_prefix?: string;
  aliases?: string[];
};

export const SG_AREA_CENTROIDS: SgAreaEntry[] = [
  { name: 'Tampines', lat: 1.3521, lng: 103.9448, postal_prefix: '52', aliases: ['tampines east', 'tampines west'] },
  { name: 'Katong / Joo Chiat', lat: 1.305, lng: 103.904, postal_prefix: '42', aliases: ['katong', 'joo chiat', 'marine parade'] },
  { name: 'Bedok', lat: 1.3235, lng: 103.9302, postal_prefix: '46' },
  { name: 'Ang Mo Kio', lat: 1.3691, lng: 103.8454, postal_prefix: '56' },
  { name: 'Jurong West', lat: 1.3404, lng: 103.7052, postal_prefix: '64' },
  { name: 'Woodlands', lat: 1.436, lng: 103.786, postal_prefix: '73' },
  { name: 'Punggol', lat: 1.405, lng: 103.9022, postal_prefix: '82' },
  { name: 'Sengkang', lat: 1.3916, lng: 103.895, postal_prefix: '54' },
  { name: 'Hougang', lat: 1.3612, lng: 103.8864, postal_prefix: '53' },
  { name: 'Toa Payoh', lat: 1.3343, lng: 103.8563, postal_prefix: '31' },
  { name: 'Bishan', lat: 1.3526, lng: 103.8352, postal_prefix: '57' },
  { name: 'Clementi', lat: 1.3162, lng: 103.7649, postal_prefix: '12' },
  { name: 'Bukit Batok', lat: 1.359, lng: 103.7647, postal_prefix: '65' },
  { name: 'Yishun', lat: 1.4304, lng: 103.8354, postal_prefix: '76' },
  { name: 'Tiong Bahru', lat: 1.2868, lng: 103.8268, postal_prefix: '16', aliases: ['tiong bahru', 'outram'] },
  { name: 'Orchard', lat: 1.3048, lng: 103.8318, postal_prefix: '23' },
  { name: 'Changi', lat: 1.3644, lng: 103.9915, postal_prefix: '50' },
];

const COOK_AREA_ALIASES: Record<string, string> = {
  Tampines: 'Tampines',
  'Katong / Joo Chiat': 'Katong / Joo Chiat',
  Katong: 'Katong / Joo Chiat',
  Jurong: 'Jurong West',
  'Joo Chiat': 'Katong / Joo Chiat',
};

export function resolveCookAreaKey(area: string): string {
  return COOK_AREA_ALIASES[area] ?? area;
}

export function getAreaCentroid(areaName: string): SgAreaEntry | undefined {
  const key = resolveCookAreaKey(areaName);
  return SG_AREA_CENTROIDS.find((a) => a.name === key || a.name === areaName);
}

export function searchLocalSgAreas(query: string, limit = 8): SgAreaEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return SG_AREA_CENTROIDS.filter((a) => {
    if (a.name.toLowerCase().includes(q)) return true;
    if (a.postal_prefix && q.startsWith(a.postal_prefix)) return true;
    return a.aliases?.some((al) => al.includes(q));
  }).slice(0, limit);
}