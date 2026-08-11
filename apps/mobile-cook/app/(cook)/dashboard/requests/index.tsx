/**
 * Open custom dish requests — any cook can browse and send a quote.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCookHeader,
  GourmeatEmptyState,
  SHCCookOpenRequestCard,
  SHCSkeletonList,
  gourmeatColors,
  shcSpacing,
  contentPadForTabBar,
} from '@shc/ui';
import { CUSTOM_REQUEST_COPY, parseCookQuoteDisplay, parseCustomRequestDisplay } from '@shc/utils';
import { useRequests, useCookMyBids } from '../../../../hooks/useOrder';

export default function CookCustomRequestsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: openReqs = [], isLoading } = useRequests();
  const { data: myBids = [] } = useCookMyBids();
  const reqList = Array.isArray(openReqs) ? openReqs : [];

  const myBidByRequestId = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const bid of myBids as Array<Record<string, unknown>>) {
      const requestId = String(bid.request_id || '');
      if (!requestId) continue;
      const status = String(bid.status || 'pending');
      if (status === 'pending' || status === 'accepted') {
        map.set(requestId, bid);
      }
    }
    return map;
  }, [myBids]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingBottom: contentPadForTabBar(insets.bottom),
        paddingHorizontal: shcSpacing.md,
      }}
      testID="cook-custom-requests-screen"
    >
      <Pressable onPress={() => router.back()} style={{ marginBottom: shcSpacing.sm }}>
        <Text style={styles.back}>← Home</Text>
      </Pressable>
      <GourmeatCookHeader title={CUSTOM_REQUEST_COPY.cookBoardTitle} />

      {isLoading ? (
        <SHCSkeletonList count={4} rowHeight={96} />
      ) : reqList.length === 0 ? (
        <GourmeatEmptyState
          title="No open requests"
          body="When customers post custom dish requests, they appear here for any home cook to quote."
        />
      ) : (
        reqList.map((r: Record<string, unknown>) => {
          const parsed = parseCustomRequestDisplay(r);
          const savedBidRaw = myBidByRequestId.get(String(r.id || ''));
          const savedBid = savedBidRaw ? parseCookQuoteDisplay(savedBidRaw, parsed.lines) : null;
          return (
            <SHCCookOpenRequestCard
              key={String(r.id)}
              request={r}
              bidSent={!!savedBid}
              bidStatus={savedBid?.status}
              onPress={() => router.push(`/(cook)/dashboard/requests/${encodeURIComponent(String(r.id))}` as any)}
              testID={`cook-open-request-${r.id}`}
            />
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  back: { fontWeight: '800', color: gourmeatColors.primary, fontSize: 14 },
});
