import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import {
  gourmeatColors,
  shcColors,
  GourmeatCookHeader,
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  SHCBadge,
  SHCFadeIn,
  shcSpacing,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '../../lib/api-client';

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: earnings = { thisWeek: 0, projectedPayout: 0, orders_count: 0 } } = useQuery({
    queryKey: ['earnings'],
    queryFn: getEarnings,
  });

  const weekTotal = earnings.thisWeek ?? 0;
  const orderCount = (earnings as { orders_count?: number; orders?: number }).orders_count
    ?? (earnings as { orders?: number }).orders
    ?? 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-earnings-screen"
    >
      <GourmeatCookHeader
        title="Earnings"
        subtitle={`${user?.name} · 85% payout · PayNow weekly`}
        badges={
          <View style={styles.heroBadges}>
            <SHCBadge variant="heritage">This week</SHCBadge>
            <SHCBadge variant="success">S${weekTotal}</SHCBadge>
          </View>
        }
      />

      <SHCFadeIn delay={60}>
        <View style={styles.statsRow}>
          <SHCCard variant="bento-mint" style={styles.statCard}>
            <Text style={styles.statLabel}>Projected</Text>
            <Text style={styles.statValue}>S${earnings.projectedPayout || weekTotal}</Text>
          </SHCCard>
          <SHCCard variant="bento-yellow" style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{orderCount} orders</Text>
          </SHCCard>
        </View>
      </SHCFadeIn>

      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.listings}
            iconKey="listings"
            label="Listings"
            variant="bento-peach"
            testID="earnings-listings-tile"
            onPress={() => router.push('/(cook)/listings' as any)}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.orders}
            iconKey="orders"
            label="Orders"
            variant="bento-mint"
            testID="earnings-orders-tile"
            onPress={() => router.push('/(cook)/orders' as any)}
          />
        </View>
      </View>

      <Link href="/(cook)/listings" asChild>
        <SHCButton testID="create-listings-btn" style={{ marginTop: shcSpacing.md }}>
          <SHCButtonText>Create more listings for earnings</SHCButtonText>
        </SHCButton>
      </Link>

      <SHCCard variant="bento-peach" style={styles.noteCard}>
        <Text style={styles.noteText}>
          Full ledger, GST, and invoices ship in Phase 6. Earnings use calculateCookEarnings() from @shc/business-rules.
        </Text>
      </SHCCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsRow: { flexDirection: 'row', gap: shcSpacing.sm, marginTop: shcSpacing.md },
  statCard: { flex: 1, padding: shcSpacing.md },
  statLabel: { fontSize: 11, fontWeight: '700', color: shcColors.textLight, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900', color: shcColors.text, marginTop: 4 },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: shcColors.text, marginTop: shcSpacing.lg, marginBottom: shcSpacing.sm },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm },
  bentoCol: { flex: 1 },
  noteCard: { marginTop: shcSpacing.md, padding: shcSpacing.md },
  noteText: { fontSize: 12, color: shcColors.textLight, lineHeight: 18 },
});