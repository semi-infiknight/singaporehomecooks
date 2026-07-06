import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function pwaStaticResponse(filename: string, contentType: string) {
  const body = readFileSync(join(process.cwd(), 'public', filename));
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}