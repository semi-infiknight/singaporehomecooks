import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  OrderStatusBadge,
  SHCSectionTitle,
  SHCBentoGrid,
  SHCBentoCell,
  SHCVisualBentoTile,
  SHCFoodImage,
  SHCBadge,
  SHCMetaBadge,
  GourmeatCookHeader,
  SHCFadeIn,
  SHCBentoIconBadge,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  DirectionalTabScreen,
  SHCSkeletonBone,
  contentPadForTabBar,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  cookDashboardTileImage,
  cookDashboardTiles,
  cookPortalGreeting,
  getDishImageUrl,
  isCookComplianceVerified,
  formatCookEarningsDisplayCompact,
  resolveCookEarningsSummary,
} from '@shc/utils';
import { useMyOrders, useRequests } from '../../../hooks/useOrder';
import { useCookEarnings } from '../../../hooks/useCookEarnings';
import { useAuth } from '../../../hooks/useAuth';
import { useCookProfile } from '../../../hooks/useCookProfile';
import { useCookConfig } from '../../../hooks/useCookConfig';
import { useQuery } from '@tanstack/react-query';
import { getComplianceDocs } from '../../../lib/api-client';

export default function CookDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: cookProfile } = useCookProfile();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Gate + AuthProvider flip to unauthenticated; replace is belt-and-suspenders.
      router.replace('/(shared)/auth' as any);
    }
  };
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const orderList = (orders as any[]) ?? [];
  // Request count — bidding UI lives under Home → Custom requests
  const requestsQuery = useRequests();
  const reqCount = Array.isArray(requestsQuery.data) ? requestsQuery.data.length : 0;
  const reqsLoading = requestsQuery.isLoading;
  const { data: complianceDocs = [] } = useQuery({
    queryKey: ['compliance-docs'],
    queryFn: () => getComplianceDocs(),
  });
  const complianceVerified = isCookComplianceVerified(
    complianceDocs as { type?: string; status?: string; verified_at?: string | null }[]
  );

  const { config } = useCookConfig();
  const quickActions = cookDashboardTiles(config);
  const { data: earningsData } = useCookEarnings();
  const earningsCents = resolveCookEarningsSummary(
    earningsData as Record<string, unknown> | undefined
  ).this_week_cents;
  const earningsLabel = formatCookEarningsDisplayCompact(earningsCents);

  // Prefer kitchen profile name from onboarding — JWT/session still says "New Home Cook".
  const kitchenName = String(
    (cookProfile as { display_name?: string } | undefined)?.display_name || user?.name || ''
  ).trim();
  const firstName = kitchenName.split(/\s+/)[0] || '';
  const greeting = firstName
    ? cookPortalGreeting(new Date(), {
        morning: `Good morning, ${firstName}`,
        afternoon: `Good afternoon, ${firstName}`,
        evening: `Good evening, ${firstName}`,
      })
    : cookPortalGreeting(new Date(), config.greeting);

  return (
    <DirectionalTabScreen testID="cook-dashboard-tab-scene">

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
      testID="cook-dashboard"
    >
      <GourmeatCookHeader
        title={greeting}
        subtitle={`${kitchenName || 'Chef'} · HDB kitchen`}
        testID="cook-dashboard-hero"
      />


      <Pressable
        onPress={() => router.push('/(cook)/settings' as any)}
        style={styles.tourBanner}
        testID="cook-kitchen-settings-link"
        accessibilityRole="button"
      >
        <Text style={styles.tourBannerTitle}>Kitchen settings</Text>
        <Text style={styles.tourBannerSub}>Profile · collection · pause orders</Text>
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

      <Pressable
        onPress={() => router.push('/(cook)/batches' as any)}
        style={[styles.tourBanner, styles.batchesBanner]}
        testID="cook-cooking-soon-banner"
        accessibilityRole="button"
      >
        <Text style={styles.tourBannerTitle}>Cooking soon</Text>
        <Text style={styles.tourBannerSub}>Post a batch · customers order from home rail</Text>
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
                    {/* <SHCMetaBadge kind="label">85% payout</SHCMetaBadge> */}
                  </View>
                  <Text style={styles.earningsLabel}>This week</Text>
                  <Text style={styles.earningsValue}>{earningsLabel}</Text>
                </View>
              }
            />
          </View>
        </SHCBentoCell>
        <SHCBentoCell variant="bento-yellow">
          <SHCBentoIconBadge iconKey="orders" size={24} />
          {ordersLoading ? (
            <SHCSkeletonBone height={22} width={36} style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.statNum}>{orderList.length}</Text>
          )}
          <Text style={styles.statLabel}>Active</Text>
        </SHCBentoCell>
        <Pressable onPress={() => router.push('/(cook)/dashboard/requests' as any)}>
          <SHCBentoCell variant="bento-peach">
            <SHCBentoIconBadge iconKey="request" size={24} />
            {reqsLoading ? (
              <SHCSkeletonBone height={22} width={36} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statNum}>{reqCount}</Text>
            )}
            <Text style={styles.statLabel}>Requests</Text>
          </SHCBentoCell>
        </Pressable>
      </SHCBentoGrid>
      </SHCFadeIn>

      {/* 2×2 visual quick actions */}
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.bentoRow}>
        {quickActions.slice(0, 2).map((action, index) => (
          <View key={action.id} style={styles.bentoCol}>
            <SHCVisualBentoTile
              imageUri={cookDashboardTileImage(action)}
              iconKey={action.icon_key}
              label={action.label}
              badge={action.id === 'listings' && orderList.length ? orderList.length : undefined}
              onPress={() => router.push(action.mobile_href as any)}
              variant={action.variant}
              testID={index === 0 ? 'cook-quick-cooking-soon' : undefined}
            />
          </View>
        ))}
      </View>
      <View style={styles.bentoRow}>
        {quickActions.slice(2, 4).map((action) => (
          <View key={action.id} style={styles.bentoCol}>
            <SHCVisualBentoTile
              imageUri={cookDashboardTileImage(action)}
              iconKey={action.icon_key}
              label={action.label}
              onPress={() => router.push(action.mobile_href as any)}
              variant={action.variant}
            />
          </View>
        ))}
      </View>
      {quickActions.length > 4 ? (
        <View style={styles.bentoRow}>
          {quickActions.slice(4, 6).map((action) => (
            <View key={action.id} style={styles.bentoCol}>
              <SHCVisualBentoTile
                imageUri={cookDashboardTileImage(action)}
                iconKey={action.icon_key}
                label={action.label}
                onPress={() => router.push(action.mobile_href as any)}
                variant={action.variant}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push('/(cook)/dashboard/requests' as any)}
        style={styles.collabLink}
        testID="collab-board-link"
        accessibilityRole="button"
      >
        <Text style={styles.collabLinkTitle}>Custom requests</Text>
        <Text style={styles.collabLinkBody}>
          {reqCount > 0 ? `${reqCount} open — tap to browse and send bids` : 'Dish requests from customers — any cook can quote'}
        </Text>
      </Pressable>

      <Text style={styles.recentLabel}>Recent Orders</Text>
      {ordersLoading && orderList.length === 0 && (
        <View style={{ paddingHorizontal: shcSpacing.md, marginBottom: shcSpacing.md }}>
          <SHCSkeletonBone height={88} radius={shcRadii.lg} style={{ marginBottom: 8 }} />
          <SHCSkeletonBone height={88} radius={shcRadii.lg} />
        </View>
      )}
      {!ordersLoading && orderList.length === 0 && (
        <View style={styles.noOrders}>
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.orders} height={64} rounded={shcRadii.md} />
          <SHCBadge variant="default">No orders yet</SHCBadge>
        </View>
      )}
      {orderList.slice(0, 4).map((o: any) => (
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
                <SHCMetaBadge kind="price">S${o.total}</SHCMetaBadge>
                <SHCMetaBadge kind="cook_date">{o.collection_date}</SHCMetaBadge>
              </View>
            </View>
            <Text style={styles.orderChevron}>›</Text>
          </Pressable>
        </Link>
      ))}

      {complianceVerified ? (
        <View style={styles.footerBadge}>
          <SHCBadge variant="success">SFA/WSQ verified</SHCBadge>
        </View>
      ) : (
        <Pressable onPress={() => router.push('/(cook)/compliance' as any)} style={styles.footerBadge}>
          <SHCBadge variant="default">Upload SFA/WSQ docs →</SHCBadge>
        </Pressable>
      )}

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
  batchesBanner: {
    backgroundColor: shcColors.bentoMint || '#D8F3E8',
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