import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { parseCookQuoteDisplay } from '@shc/utils';
import { CookRequestQuoteDraftProvider } from '../../../../../lib/cook-request-quote-draft';
import { useCustomRequest, useCookMyBids } from '../../../../../hooks/useOrder';

export default function CookRequestDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = String(id || '');
  const { data: raw } = useCustomRequest(requestId);
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="line/[lineId]" />
      </Stack>
    </CookRequestQuoteDraftProvider>
  );
}
