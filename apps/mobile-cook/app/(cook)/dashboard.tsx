import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
import { useMyOrders, useRequests } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { clearCookOnboardingSeen } from '../../lib/onboarding';

const QUICK_ACTIONS = [
  { href: '/(cook)/listings', iconKey: 'listings' as const, label: 'Listings', image: BENTO_ACTION_IMAGES.listings, variant: 'bento-peach' as const },
  { href: '/(cook)/orders', iconKey: 'orders' as const, label: 'Orders', image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
  { href: '/(cook)/tiffin', iconKey: 'home' as const, label: 'Tiffin OS', image: BENTO_ACTION_IMAGES.listings, variant: 'bento-yellow' as const },
  { href: '/(cook)/earnings', iconKey: 'earnings' as const, label: 'Earnings', image: BENTO_ACTION_IMAGES.earnings, variant: 'bento-yellow' as const },
  { href: '/(cook)/compliance', iconKey: 'compliance' as const, label: 'Compliance', image: BENTO_ACTION_IMAGES.compliance, variant: 'bento-peach' as const },
];

export default function CookDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(shared)/auth' as any);
  };
  const { data: orders = [] } = useMyOrders();
  const { data: openReqs = [] } = useRequests();
  const reqCount = Array.isArray(openReqs) ? openReqs.length : 0;

  const earnings = orders
    .filter((o: any) => o.shc_status === 'completed')
    .reduce((s: number, o: any) => s + Math.floor((o.total || 0) * 0.85), 0);

  return (
    <DirectionalTabScreen testID="cook-dashboard-tab-scene">

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

      <Pressable
        onPress={async () => {
          await clearCookOnboardingSeen();
          router.push('/(shared)/onboarding' as any);
        }}
        style={styles.tourBanner}
        testID="cook-kitchen-tour-link"
        accessibilityRole="button"
      >
        <Text style={styles.tourBannerTitle}>Kitchen setup tour</Text>
        <Text style={styles.tourBannerSub}>Story · collection · PDPA — replay anytime</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(cook)/tiffin' as any)}
        style={[styles.tourBanner, styles.tiffinBanner]}
        testID="cook-tiffin-ops-banner"
        accessibilityRole="button"
      >
        <Text style={styles.tourBannerTitle}>Tiffin kitchen OS</Text>
        <Text style={styles.tourBannerSub}>Publish day menu · cancel kitchen day · visibility</Text>
      </Pressable>

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
          <Text style={styles.statNum}>{reqCount}</Text>
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

      {/* Collaboration lives under Orders tab */}
      <Pressable
        onPress={() => router.push('/(cook)/orders' as any)}
        style={styles.collabLink}
        testID="collab-board-link"
        accessibilityRole="button"
      >
        <Text style={styles.collabLinkTitle}>Collaboration Board</Text>
        <Text style={styles.collabLinkBody}>Recipe requests & bids → open under Orders</Text>
      </Pressable>

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

      <Pressable
        onPress={handleLogout}
        style={styles.logoutBtn}
        testID="logout-btn"
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%' },
  tourBanner: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.bentoPeach || '#FFE8DE',
    ...shcShadows.brutalSm,
  },
  tiffinBanner: {
    backgroundColor: shcColors.bentoYellow || '#FFF3C4',
  },
  tourBannerTitle: { fontSize: 16, fontWeight: '800', color: shcColors.text },
  tourBannerSub: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2 },
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
  collabLink: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  collabLinkTitle: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  collabLinkBody: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4 },
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
  footerBadge: { marginTop: shcSpacing.md, marginBottom: shcSpacing.sm, alignItems: 'flex-start' },
  logoutBtn: {
    marginTop: shcSpacing.sm,
    marginBottom: shcSpacing.lg,
    paddingVertical: shcSpacing.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surface,
    alignItems: 'center',
    ...shcShadows.brutalSm,
  },
  logoutText: { color: shcColors.error, textAlign: 'center', fontWeight: '800', fontSize: 15 },
});