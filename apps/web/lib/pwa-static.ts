import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PWA_ASSETS_DIR = join(process.cwd(), 'public', 'pwa-assets');

export function pwaStaticResponse(filename: string, contentType: string) {
  const body = readFileSync(join(PWA_ASSETS_DIR, filename));
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}