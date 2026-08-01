'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { CookRequestQuoteDraftProvider } from '../../../../lib/cook-request-quote-draft';
import { useCookCustomRequest, useCookMyBids } from '../../../../lib/useCookPortal';

export default function CookRequestDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const requestId = String(params.id || '');
  const { data: raw } = useCookCustomRequest(requestId);
  const { data: myBids = [] } = useCookMyBids();

  const savedBidRaw = useMemo(() => {
    return (myBids as Array<Record<string, unknown>>).find(
      (bid) =>
        String(bid.request_id || '') === requestId &&
        ['pending', 'accepted'].includes(String(bid.status || 'pending'))
    );
  }, [myBids, requestId]);

  const request = (raw || { id: requestId }) as Record<string, unknown>;

  return (
    <CookRequestQuoteDraftProvider request={request} initialQuote={savedBidRaw}>
      {children}
    </CookRequestQuoteDraftProvider>
  );
}
