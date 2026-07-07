import { pwaStaticResponse } from '../../lib/pwa-static';

export const dynamic = 'force-static';

export async function GET() {
  return pwaStaticResponse('og-image.png', 'image/png');
}
