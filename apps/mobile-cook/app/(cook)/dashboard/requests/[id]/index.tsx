/**
 * Custom request detail — tap each dish to set your price, then send bid.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCCustomRequestDetailHeader,
  SHCCookRequestDishRow,
  SHCCookQuoteBuilder,
  SHCCookSavedQuote,
  SHCSkeletonList,
  SHCMetaBadge,
  gourmeatColors,
  shcSpacing,
  contentPadForTabBar,
} from '@shc/ui';
import {
  CUSTOM_REQUEST_COPY,
  parseCustomRequestDisplay,
  parseCookQuoteDisplay,
  shcGuestCountBadgeLabel,
} from '@shc/utils';
import { useCustomRequest, useCreateBid, useCookMyBids } from '../../../../../hooks/useOrder';
import { useCookRequestQuoteDraft } from '../../../../../lib/cook-request-quote-draft';

export default function CookCustomRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = String(id || '');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: raw, isLoading } = useCustomRequest(requestId);
  const { data: myBids = [] } = useCookMyBids();
  const createBidMut = useCreateBid();
  const { lines, message, setMessage } = useCookRequestQuoteDraft();
  const [editing, setEditing] = useState(false);

  const parsed = useMemo(
    () => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null),
    [raw]
  );

  const savedBidRaw = useMemo(() => {
    return (myBids as Array<Record<string, unknown>>).find(
      (bid) =>
        String(bid.request_id || '') === requestId &&
        ['pending', 'accepted'].includes(String(bid.status || 'pending'))
    );
  }, [myBids, requestId]);

  const savedBid = useMemo(() => {
    if (!savedBidRaw || !parsed) return null;
    return parseCookQuoteDisplay(savedBidRaw, parsed.lines);
  }, [savedBidRaw, parsed]);

  const showBuilder = !savedBid || editing;

  const handleQuote = async (payload: {
    line_items: typeof lines;
    message?: string;
    price_cents: number;
  }) => {
    try {
      await createBidMut.mutateAsync({
        requestId,
        priceCents: payload.price_cents,
        message: payload.message,
        lineItems: payload.line_items.map((l) => ({
          request_line_id: l.request_line_id,
          included: l.included,
          servings: l.servings,
          price_cents: l.price_cents,
        })),
      });
      setEditing(false);
      Alert.alert(CUSTOM_REQUEST_COPY.bidSentLabel, CUSTOM_REQUEST_COPY.quoteSavedHint);
    } catch (e) {
      Alert.alert('Could not send bid', (e as Error).message || 'Please try again.');
    }
  };

  return (
    <View style={styles.screen} testID="cook-custom-request-detail">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingBottom: contentPadForTabBar(insets.bottom) + shcSpacing.lg,
          paddingHorizontal: shcSpacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: shcSpacing.sm }}>
          <Text style={styles.back}>← Requests</Text>
        </Pressable>
        <GourmeatScreenHeader title="Request detail" subtitle={CUSTOM_REQUEST_COPY.cookBoardHint} />

        {isLoading || !parsed || !raw ? (
          <SHCSkeletonList count={4} rowHeight={72} />
        ) : (
          <>
            <SHCCustomRequestDetailHeader parsed={parsed} />
            <View style={styles.metaRow}>
              {parsed.guest_count ? (
                <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge>
              ) : null}
              {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
            </View>

            <Text style={styles.sectionTitle}>Dishes to quote</Text>
            <Text style={styles.sectionHint}>Tap each dish to open its page and set your price.</Text>
            {parsed.lines.map((line) => {
              const qLine = lines.find((l) => l.request_line_id === line.id);
              return (
                <SHCCookRequestDishRow
                  key={line.id}
                  line={line}
                  quoteLine={qLine}
                  onPress={() =>
                    router.push(`/(cook)/dashboard/requests/${encodeURIComponent(requestId)}/line/${encodeURIComponent(line.id)}` as any)
                  }
                  testID={`cook-request-dish-${line.id}`}
                />
              );
            })}

            {showBuilder ? (
              <View style={{ marginTop: shcSpacing.md }} testID={`quote-builder-${requestId}`}>
                <SHCCookQuoteBuilder
                  request={raw as Record<string, unknown>}
                  lines={lines}
                  message={message}
                  onMessageChange={setMessage}
                  hideDishRows
                  busy={createBidMut.isPending}
                  initialQuote={savedBidRaw}
                  submitLabel={savedBid ? CUSTOM_REQUEST_COPY.updateQuote : CUSTOM_REQUEST_COPY.sendQuote}
                  onSubmit={handleQuote}
                  testID={`quote-builder-${requestId}`}
                />
              </View>
            ) : savedBid ? (
              <SHCCookSavedQuote
                quote={savedBid}
                requestLines={parsed.lines}
                onEdit={() => setEditing(true)}
                testID={`cook-saved-quote-${requestId}`}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  back: { fontWeight: '800', color: gourmeatColors.primary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginTop: shcSpacing.lg, marginBottom: 4 },
  sectionHint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
});
