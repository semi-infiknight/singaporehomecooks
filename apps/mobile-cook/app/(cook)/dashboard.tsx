import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  OrderStatusBadge,
  SHCSectionTitle,
  SHCBentoGrid,
  SHCBentoCell,
  SHCVisualBentoTile,
  SHCFoodImage,
  SHCBadge,
  GourmeatCookHeader,
  SHCFadeIn,
  SHCBentoIconBadge,
  SHCIcon,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, getDishImageUrl } from '@shc/utils';
import { useMyOrders, useRequests, useCreateBid } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';

const QUICK_ACTIONS = [
  { href: '/(cook)/listings', iconKey: 'listings' as const, label: 'Listings', image: BENTO_ACTION_IMAGES.listings, variant: 'bento-peach' as const },
  { href: '/(cook)/orders', iconKey: 'orders' as const, label: 'Orders', image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
  { href: '/(cook)/earnings', iconKey: 'earnings' as const, label: 'Earnings', image: BENTO_ACTION_IMAGES.earnings, variant: 'bento-yellow' as const },
  { href: '/(cook)/compliance', iconKey: 'compliance' as const, label: 'Compliance', image: BENTO_ACTION_IMAGES.compliance, variant: 'bento-peach' as const },
];

export default function CookDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders();
  const { data: openReqs = [] } = useRequests();
  const createBidMut = useCreateBid();

  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [collabMsg, setCollabMsg] = useState('');

  const earnings = orders
    .filter((o: any) => o.shc_status === 'completed')
    .reduce((s: number, o: any) => s + Math.floor((o.total || 0) * 0.85), 0);

  const handleBid = async (reqId: string) => {
    const price = parseInt(bidPrices[reqId] || '1200');
    await createBidMut.mutateAsync({
      requestId: reqId,
      priceCents: price,
      message: collabMsg || 'Heritage HDB recipe interpretation ready. Flexible for your party size.',
    });
    setCollabMsg('');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-dashboard"
    >
      <GourmeatCookHeader
        title="Good morning, Chef"
        subtitle={`${user?.name} · HDB kitchen · 85% payout`}
        testID="cook-dashboard-hero"
        badges={
          <View style={styles.heroBadges}>
            <SHCBadge variant="heritage">85% payout</SHCBadge>
            <SHCBadge variant="success">S${earnings} this week</SHCBadge>
          </View>
        }
      />

      <SHCFadeIn delay={60}>
      <SHCBentoGrid style={styles.earningsBento}>
        <SHCBentoCell variant="bento-mint" span={2} style={styles.earningsHero}>
          <View style={styles.earningsVisual}>
            <SHCFoodImage
              uri={BENTO_ACTION_IMAGES.earnings}
              height={100}
              rounded={shcRadii.lg}
              overlay={
                <View style={styles.earningsOverlay}>
                  <View style={styles.earningsTopRow}>
                    <SHCBentoIconBadge iconKey="earnings" size={28} />
                    <SHCBadge variant="heritage">85% payout</SHCBadge>
                  </View>
                  <Text style={styles.earningsLabel}>This week</Text>
                  <Text style={styles.earningsValue}>S${earnings}</Text>
                </View>
              }
            />
          </View>
        </SHCBentoCell>
        <SHCBentoCell variant="bento-yellow">
          <SHCBentoIconBadge iconKey="orders" size={24} />
          <Text style={styles.statNum}>{orders.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </SHCBentoCell>
        <SHCBentoCell variant="bento-peach">
          <SHCBentoIconBadge iconKey="request" size={24} />
          <Text style={styles.statNum}>{openReqs.length}</Text>
          <Text style={styles.statLabel}>Requests</Text>
        </SHCBentoCell>
      </SHCBentoGrid>
      </SHCFadeIn>

      {/* 2×2 visual quick actions */}
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={QUICK_ACTIONS[0].image}
            iconKey={QUICK_ACTIONS[0].iconKey}
            label={QUICK_ACTIONS[0].label}
            onPress={() => router.push(QUICK_ACTIONS[0].href as any)}
            variant={QUICK_ACTIONS[0].variant}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={QUICK_ACTIONS[1].image}
            iconKey={QUICK_ACTIONS[1].iconKey}
            label={QUICK_ACTIONS[1].label}
            badge={orders.length || undefined}
            onPress={() => router.push(QUICK_ACTIONS[1].href as any)}
            variant={QUICK_ACTIONS[1].variant}
          />
        </View>
      </View>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={QUICK_ACTIONS[2].image}
            iconKey={QUICK_ACTIONS[2].iconKey}
            label={QUICK_ACTIONS[2].label}
            onPress={() => router.push(QUICK_ACTIONS[2].href as any)}
            variant={QUICK_ACTIONS[2].variant}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={QUICK_ACTIONS[3].image}
            iconKey={QUICK_ACTIONS[3].iconKey}
            label={QUICK_ACTIONS[3].label}
            onPress={() => router.push(QUICK_ACTIONS[3].href as any)}
            variant={QUICK_ACTIONS[3].variant}
          />
        </View>
      </View>

      <Link href="/(shared)/chat/SHC-2026-00001" asChild>
        <SHCButton variant="outline" style={styles.chatBtn}>
          <SHCButtonText>Demo Chat</SHCButtonText>
        </SHCButton>
      </Link>

      {/* Collaboration board */}
      <View style={styles.sectionHeader}>
        <SHCSectionTitle style={styles.collabTitle}>Collaboration Board</SHCSectionTitle>
        {openReqs.length > 0 && <SHCBadge variant="warning">{openReqs.length} open</SHCBadge>}
      </View>
      <SHCCard variant="bento-peach">
        {openReqs.length === 0 && (
          <View style={styles.collabEmpty}>
            <SHCFoodImage uri={BENTO_ACTION_IMAGES.request} height={64} rounded={shcRadii.md} />
            <SHCBadge variant="default">No open requests</SHCBadge>
          </View>
        )}
        {openReqs.map((r: any) => (
          <SHCCard key={r.id} style={styles.collabCard} testID={`collab-req-${r.id}`}>
            <Text style={styles.collabBody} numberOfLines={2}>{r.body}</Text>
            <View style={styles.collabBadges}>
              <SHCBadge variant="heritage">{r.party_size || '?'} guests</SHCBadge>
              <SHCBadge variant="default">S${r.budget_cents ? (r.budget_cents / 100).toFixed(0) : '—'}</SHCBadge>
              <SHCBadge variant="default">{r.date}</SHCBadge>
            </View>
            <TextInput
              placeholder="Bid S$ e.g. 14"
              value={bidPrices[r.id] || ''}
              onChangeText={(t) => setBidPrices((p) => ({ ...p, [r.id]: t }))}
              keyboardType="numeric"
              style={styles.collabInput}
            />
            <TextInput
              placeholder="Message (optional)"
              value={collabMsg}
              onChangeText={setCollabMsg}
              style={styles.collabInput}
            />
            <SHCButton size="sm" onPress={() => handleBid(r.id)} testID={`bid-btn-${r.id}`}>
              <SHCButtonText>Bid</SHCButtonText>
            </SHCButton>

          </SHCCard>
        ))}
      </SHCCard>

      {/* Heritage archive */}
      <SHCSectionTitle>Heritage Archive</SHCSectionTitle>
      <SHCCard variant="bento-mint" style={styles.heritageCard}>
        <SHCFoodImage
          uri={BENTO_ACTION_IMAGES.listings}
          height={72}
          rounded={shcRadii.md}
          overlay={
            <View style={styles.heritageOverlay}>
              <SHCIcon name="document" size={22} color={shcColors.onPrimary} active />
              <SHCBadge variant="heritage">NLB · NHB</SHCBadge>
            </View>
          }
        />
        <SHCButton
          onPress={async () => {
            const mod: any = await import('../../lib/api-client');
            if (mod.addHeritageEntry) {
              await mod.addHeritageEntry(user?.id || '', {
                title: 'New Family Story ' + Date.now(),
                story: 'HDB kitchen ritual from 1970s — passed to next gen for Hari Raya & gatherings.',
                photo_stub: 'hdb-kitchen-stub.jpg',
              });
            }
            (global as any).alert
              ? (global as any).alert('Heritage entry added (permanent). View on your cook profile.')
              : console.log('added');
          }}
          testID="add-heritage-btn"
          style={styles.heritageBtn}
        >
          <SHCButtonText>+ Add Story</SHCButtonText>
        </SHCButton>
      </SHCCard>

      <Text style={styles.recentLabel}>Recent Orders</Text>
      {orders.length === 0 && (
        <View style={styles.noOrders}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.orders} height={64} rounded={shcRadii.md} />
          <SHCBadge variant="default">No orders yet</SHCBadge>
        </View>
      )}
      {orders.slice(0, 4).map((o: any) => (
        <Link key={o.id} href={`/(cook)/orders/${o.id}` as any} asChild>
          <Pressable style={styles.orderCard}>
            <SHCFoodImage
              uri={getDishImageUrl({ name: o.items?.[0]?.name })}
              width={72}
              height={72}
              rounded={shcRadii.md}
            />
            <View style={styles.orderInfo}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDish} numberOfLines={1}>{o.items?.[0]?.name}</Text>
                <OrderStatusBadge status={o.shc_status} />
              </View>
              <View style={styles.orderBadges}>
                <SHCBadge variant="default">S${o.total}</SHCBadge>
                <SHCBadge variant="heritage">{o.collection_date}</SHCBadge>
              </View>
            </View>
            <Text style={styles.orderChevron}>›</Text>
          </Pressable>
        </Link>
      ))}

      <View style={styles.footerBadge}>
        <SHCBadge variant="success">SFA/WSQ verified</SHCBadge>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%' },
  earningsBento: { marginBottom: shcSpacing.md },
  earningsHero: { padding: 0, overflow: 'hidden' },
  earningsVisual: { margin: -shcSpacing.sm },
  earningsOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(36,24,18,0.45)',
    padding: shcSpacing.sm,
  },
  earningsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel: { fontSize: 11, fontWeight: '600', color: shcColors.onPrimary, opacity: 0.9 },
  earningsValue: { fontSize: 28, fontWeight: '900', color: shcColors.onPrimary },
  statNum: { fontSize: 22, fontWeight: '900', color: shcColors.text, marginTop: 4 },
  statLabel: { fontSize: 11, color: shcColors.textLight, fontWeight: '600', marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: shcColors.text, marginBottom: shcSpacing.sm, marginTop: shcSpacing.sm },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  bentoCol: { flex: 1 },
  chatBtn: { marginTop: shcSpacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: shcSpacing.lg },
  collabTitle: { marginTop: 0, flex: 1 },
  collabEmpty: { alignItems: 'center', paddingVertical: shcSpacing.md, gap: shcSpacing.sm },

  collabCard: { marginTop: shcSpacing.sm, backgroundColor: shcColors.surface },
  collabBody: { fontWeight: '700', color: shcColors.text },
  collabBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: shcSpacing.sm },
  collabInput: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    padding: shcSpacing.sm,
    marginVertical: 4,
    backgroundColor: shcColors.surface,
    borderRadius: shcRadii.md,
    ...shcShadows.brutalSm,
  },
  acceptBtn: { marginTop: 4 },
  heritageCard: { gap: shcSpacing.sm },
  heritageOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(36,24,18,0.35)',
    padding: shcSpacing.sm,
  },

  heritageBtn: { marginTop: shcSpacing.xs },
  recentLabel: { marginTop: shcSpacing.md, fontWeight: '800', color: shcColors.primary, fontSize: 15 },
  noOrders: { alignItems: 'center', paddingVertical: shcSpacing.md, gap: shcSpacing.sm },

  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: shcSpacing.sm,
    marginVertical: 6,
    padding: shcSpacing.sm,
    backgroundColor: shcColors.surface,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    ...shcShadows.brutalSm,
  },
  orderInfo: { flex: 1, gap: 4 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  orderDish: { fontWeight: '700', fontSize: 14, color: shcColors.text, flex: 1 },
  orderBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  orderChevron: { fontSize: 22, fontWeight: '800', color: shcColors.primary },
  footerBadge: { marginTop: shcSpacing.md, marginBottom: shcSpacing.md, alignItems: 'flex-start' },
});