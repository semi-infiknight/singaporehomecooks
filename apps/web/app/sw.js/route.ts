import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const body = readFileSync(join(process.cwd(), 'public', 'pwa-assets', 'sw.js'), 'utf8');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}