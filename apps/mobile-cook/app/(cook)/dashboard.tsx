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
  DirectionalTabScreen,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, getDishImageUrl } from '@shc/utils';
import { useMyOrders, useRequests, useCreateBid } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { useShcI18n, getCookQuickActionLabels, getCookDashboardExtras } from '@shc/i18n';

const QUICK_ACTION_HREFS = [
  { href: '/(cook)/listings', iconKey: 'listings' as const, image: BENTO_ACTION_IMAGES.listings, variant: 'bento-peach' as const },
  { href: '/(cook)/orders', iconKey: 'orders' as const, image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
  { href: '/(cook)/earnings', iconKey: 'earnings' as const, image: BENTO_ACTION_IMAGES.earnings, variant: 'bento-yellow' as const },
  { href: '/(cook)/compliance', iconKey: 'compliance' as const, image: BENTO_ACTION_IMAGES.compliance, variant: 'bento-peach' as const },
] as const;

export default function CookDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useShcI18n();
  const quickLabels = getCookQuickActionLabels(locale);
  const dashExtras = getCookDashboardExtras(locale);
  const quickActions = [
    { ...QUICK_ACTION_HREFS[0], label: quickLabels.listings },
    { ...QUICK_ACTION_HREFS[1], label: quickLabels.orders },
    { ...QUICK_ACTION_HREFS[2], label: quickLabels.earnings },
    { ...QUICK_ACTION_HREFS[3], label: quickLabels.compliance },
  ];
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
      message: collabMsg || dashExtras.bidDefaultMessage,
    });
    setCollabMsg('');
  };

  return (
    <DirectionalTabScreen testID="cook-dashboard-tab-scene">

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-dashboard"
    >
      <GourmeatCookHeader
        title={t('cook.dashboard.greeting')}
        subtitle={t('cook.dashboard.subtitle').replace('{name}', user?.name || '')}
        testID="cook-dashboard-hero"
        badges={
          <View style={styles.heroBadges}>
            <SHCBadge variant="heritage">{t('cook.dashboard.payout_badge')}</SHCBadge>
            <SHCBadge variant="success">{t('cook.dashboard.earnings_badge').replace('{amount}', String(earnings))}</SHCBadge>
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
                    <SHCBadge variant="heritage">{t('cook.dashboard.payout_badge')}</SHCBadge>
                  </View>
                  <Text style={styles.earningsLabel}>{t('cook.dashboard.this_week')}</Text>
                  <Text style={styles.earningsValue}>S${earnings}</Text>
                </View>
              }
            />
          </View>
        </SHCBentoCell>
        <SHCBentoCell variant="bento-yellow">
          <SHCBentoIconBadge iconKey="orders" size={24} />
          <Text style={styles.statNum}>{orders.length}</Text>
          <Text style={styles.statLabel}>{t('cook.dashboard.active')}</Text>
        </SHCBentoCell>
        <SHCBentoCell variant="bento-peach">
          <SHCBentoIconBadge iconKey="request" size={24} />
          <Text style={styles.statNum}>{openReqs.length}</Text>
          <Text style={styles.statLabel}>{t('cook.dashboard.requests')}</Text>
        </SHCBentoCell>
      </SHCBentoGrid>
      </SHCFadeIn>

      {/* 2×2 visual quick actions */}
      <Text style={styles.sectionLabel}>{t('cook.dashboard.quick_actions')}</Text>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={quickActions[0].image}
            iconKey={quickActions[0].iconKey}
            label={quickActions[0].label}
            onPress={() => router.push(quickActions[0].href as any)}
            variant={quickActions[0].variant}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={quickActions[1].image}
            iconKey={quickActions[1].iconKey}
            label={quickActions[1].label}
            badge={orders.length || undefined}
            onPress={() => router.push(quickActions[1].href as any)}
            variant={quickActions[1].variant}
          />
        </View>
      </View>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={quickActions[2].image}
            iconKey={quickActions[2].iconKey}
            label={quickActions[2].label}
            onPress={() => router.push(quickActions[2].href as any)}
            variant={quickActions[2].variant}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={quickActions[3].image}
            iconKey={quickActions[3].iconKey}
            label={quickActions[3].label}
            onPress={() => router.push(quickActions[3].href as any)}
            variant={quickActions[3].variant}
          />
        </View>
      </View>

      <Link href="/(shared)/chat/SHC-2026-00001" asChild>
        <SHCButton variant="outline" style={styles.chatBtn}>
          <SHCButtonText>{t('cook.dashboard.demo_chat')}</SHCButtonText>
        </SHCButton>
      </Link>

      {/* Collaboration board */}
      <View style={styles.sectionHeader}>
        <SHCSectionTitle style={styles.collabTitle}>{t('cook.dashboard.collab_board')}</SHCSectionTitle>
        {openReqs.length > 0 && (
          <SHCBadge variant="warning">{t('cook.dashboard.open_requests').replace('{count}', String(openReqs.length))}</SHCBadge>
        )}
      </View>
      <SHCCard variant="bento-peach">
        {openReqs.length === 0 && (
          <View style={styles.collabEmpty}>
            <SHCFoodImage uri={BENTO_ACTION_IMAGES.request} height={64} rounded={shcRadii.md} />
            <SHCBadge variant="default">{t('cook.dashboard.no_requests')}</SHCBadge>
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
              placeholder={t('cook.dashboard.bid_placeholder')}
              value={bidPrices[r.id] || ''}
              onChangeText={(text) => setBidPrices((p) => ({ ...p, [r.id]: text }))}
              keyboardType="numeric"
              style={styles.collabInput}
            />
            <TextInput
              placeholder={t('cook.dashboard.message_placeholder')}
              value={collabMsg}
              onChangeText={setCollabMsg}
              style={styles.collabInput}
            />
            <SHCButton size="sm" onPress={() => handleBid(r.id)} testID={`bid-btn-${r.id}`}>
              <SHCButtonText>{t('cook.dashboard.bid_btn')}</SHCButtonText>
            </SHCButton>

          </SHCCard>
        ))}
      </SHCCard>

      {/* Heritage archive */}
      <SHCSectionTitle>{t('cook.dashboard.heritage_archive')}</SHCSectionTitle>
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
              ? (global as any).alert(dashExtras.heritageAdded)
              : console.log('added');
          }}
          testID="add-heritage-btn"
          style={styles.heritageBtn}
        >
          <SHCButtonText>{dashExtras.addStory}</SHCButtonText>
        </SHCButton>
      </SHCCard>

      <Text style={styles.recentLabel}>{dashExtras.recentOrders}</Text>
      {orders.length === 0 && (
        <View style={styles.noOrders}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.orders} height={64} rounded={shcRadii.md} />
          <SHCBadge variant="default">{dashExtras.noOrdersYet}</SHCBadge>
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
        <SHCBadge variant="success">{dashExtras.verifiedBadge}</SHCBadge>
      </View>
    </ScrollView>
  
    </DirectionalTabScreen>
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