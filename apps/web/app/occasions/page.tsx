'use client';

/**
 * Legacy /occasions browse removed (no occasion tagging on dishes).
 * Redirect any bookmarks / promo links to custom request.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OccasionsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/request');
  }, [router]);
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center" data-testid="occasions-redirect">
      <p className="text-sm font-semibold text-muted-foreground">Opening custom request…</p>
    </div>
  );
}
