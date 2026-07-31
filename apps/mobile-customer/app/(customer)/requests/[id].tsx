/**
 * Custom request detail — dish lines, status, cook quotes, accept.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCCustomRequestDetailHeader,
  SHCCustomRequestLineList,
  SHCCookQuoteCard,
  SHCSkeletonList,
  gourmeatColors,
  shcSpacing,
  contentPadForTabBar,
  SHCMetaBadge,
} from '@shc/ui';
import {
  CUSTOM_REQUEST_COPY,
  formatQuoteTotal,
  parseCustomRequestDisplay,
  shcGuestCountBadgeLabel,
} from '@shc/utils';
import { useCustomRequest, useBids, useAcceptBid } from '../../../hooks/useOrder';

export default function CustomRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: raw, isLoading } = useCustomRequest(String(id || ''));
  const { data: bids = [] } = useBids(String(id || ''));
  const acceptQuote = useAcceptBid();
  const parsed = useMemo(() => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null), [raw]);
  const pendingQuotes = (bids as any[]).filter((b) => b.status === 'pending');

  return (
    <View style={styles.screen} testID="custom-request-detail">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingBottom: contentPadForTabBar(insets.bottom) + shcSpacing.lg,
          paddingHorizontal: shcSpacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: shcSpacing.sm }}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <GourmeatScreenHeader title="Request detail" subtitle={CUSTOM_REQUEST_COPY.customerSectionHint} />

        {isLoading || !parsed ? (
          <SHCSkeletonList count={4} rowHeight={72} />
        ) : (
          <>
            <SHCCustomRequestDetailHeader parsed={parsed} />
            <View style={styles.metaRow}>
              {parsed.guest_count ? (
                <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge>
              ) : null}
              {parsed.budget_cents != null ? (
                <SHCMetaBadge kind="price">Budget {formatQuoteTotal(parsed.budget_cents)}</SHCMetaBadge>
              ) : null}
              {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
            </View>
            <Text style={styles.sectionTitle}>Dishes requested</Text>
            <SHCCustomRequestLineList lines={parsed.lines} testID="request-line-list" />
            <Text style={[styles.sectionTitle, { marginTop: shcSpacing.lg }]}>
              Cook {CUSTOM_REQUEST_COPY.quoteNounPlural} ({pendingQuotes.length})
            </Text>
            {pendingQuotes.length === 0 ? (
              <Text style={styles.empty}>{CUSTOM_REQUEST_COPY.noQuotesYet}</Text>
            ) : (
              pendingQuotes.map((quote: any) => (
                <SHCCookQuoteCard
                  key={quote.id}
                  quote={quote}
                  cookName={quote.cook_name}
                  accepting={acceptQuote.isPending && acceptQuote.variables === quote.id}
                  onAccept={() => acceptQuote.mutate(quote.id)}
                  testID={`quote-${quote.id}`}
                />
              ))
            )}
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
  sectionTitle: { fontSize: 15, fontWeight: '900', marginTop: shcSpacing.md, marginBottom: shcSpacing.sm },
  empty: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight },
});
