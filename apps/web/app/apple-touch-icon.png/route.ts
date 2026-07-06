import { pwaStaticResponse } from '../../lib/pwa-static';

export const dynamic = 'force-static';

export async function GET() {
  return pwaStaticResponse('apple-touch-icon.png', 'image/png');
}