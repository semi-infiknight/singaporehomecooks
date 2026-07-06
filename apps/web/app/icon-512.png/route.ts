import { pwaStaticResponse } from '../../lib/pwa-static';

export const dynamic = 'force-static';

export async function GET() {
  return pwaStaticResponse('icon-512.png', 'image/png');
}