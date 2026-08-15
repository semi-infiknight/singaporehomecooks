import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OrderStatusBadge,
  SHCBadge,
  SHCMetaBadge,
  GourmeatCookHeader,
  SHCFadeIn,
  SHCBentoIconBadge,
  SHCFoodImage,
  SHCSkeletonBone,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  DirectionalTabScreen,
  contentPadForTabBar,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  cookDashboardTiles,
  cookPortalGreeting,
  getDishImageUrl,
  isCookComplianceVerified,
  formatCookEarningsDisplayCompact,
  resolveCookEarningsSummary,
  cookHasPaynowConfigured,
  getActiveOrders,
  buildCookDashboardSetupItems,
  cookDashboardIncompleteSetup,
  cookDashboardKitchenSubtitle,
  cookDashboardAddressLine,
  cookDashboardOrdersNeedingCook,
} from '@shc/utils';
import { useMyOrders, useRequests, useComplianceDocs } from '../../../hooks/useOrder';
import { useCookEarnings } from '../../../hooks/useCookEarnings';
import { useCookListings } from '../../../hooks/useProducts';
import { useAuth } from '../../../hooks/useAuth';
import { useCookProfile } from '../../../hooks/useCookProfile';
import { useCookConfig } from '../../../hooks/useCookConfig';

function StatCell({
  label,
  value,
  loading,
  iconKey,
  onPress,
  testID,
  tone = 'mint',
}: {
  label: string;
  value: string | number;
  loading?: boolean;
  iconKey: 'earnings' | 'orders' | 'request' | 'listings';
  onPress?: () => void;
  testID?: string;
  tone?: 'mint' | 'peach' | 'yellow';
}) {
  const bg =
    tone === 'peach' ? shcColors.bentoPeach : tone === 'yellow' ? shcColors.bentoYellow : shcColors.bentoMint;
  const body = (
    <View style={[styles.statCell, { backgroundColor: bg || shcColors.surface }]} testID={testID}>
      <SHCBentoIconBadge iconKey={iconKey} size={22} />
      {loading ? (
        <SHCSkeletonBone height={22} width={40} style={{ marginTop: 8 }} />
      ) : (
        <Text style={styles.statNum} numberOfLines={1}>
          {value}
        </Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

export default function CookDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: cookProfile } = useCookProfile();
  const profile = (cookProfile || {}) as Record<string, unknown>;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(shared)/auth' as any);
    }
  };

  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const orderList = (orders as any[]) ?? [];
  const activeOrders = useMemo(() => getActiveOrders(orderList), [orderList]);
  const needsCook = useMemo(() => cookDashboardOrdersNeedingCook(orderList), [orderList]);

  const requestsQuery = useRequests();
  const reqCount = Array.isArray(requestsQuery.data) ? requestsQuery.data.length : 0;
  const reqsLoading = requestsQuery.isLoading;

  const { data: myListings, isLoading: listingsLoading } = useCookListings();
  const listingList = Array.isArray(myListings) ? myListings : [];
  const listingCount = listingList.length;

  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceVerified = isCookComplianceVerified(
    complianceDocs as { type?: string; status?: string; verified_at?: string | null }[]
  );

  const { config } = useCookConfig();
  const toolTiles = cookDashboardTiles(config).filter((t) =>
    ['listings', 'orders', 'cooking-soon', 'compliance'].includes(t.id)
  );

  const { data: earningsData } = useCookEarnings();
  const earningsCents = resolveCookEarningsSummary(
    earningsData as Record<string, unknown> | undefined
  ).this_week_cents;
  const earningsLabel = formatCookEarningsDisplayCompact(earningsCents);

  const kitchenName = String(profile.display_name || user?.name || '').trim();
  const firstName = kitchenName.split(/\s+/)[0] || '';
  const greeting = firstName
    ? cookPortalGreeting(new Date(), {
        morning: `Good morning, ${firstName}`,
        afternoon: `Good afternoon, ${firstName}`,
        evening: `Good evening, ${firstName}`,
      })
    : cookPortalGreeting(new Date(), config.greeting);

  const paynowConfigured = cookHasPaynowConfigured({
    paynow_mobile: profile.paynow_mobile as string | null | undefined,
    paynow_uen: profile.paynow_uen as string | null | undefined,
    payout_legal_name: profile.payout_legal_name as string | null | undefined,
  });

  const snapshot = {
    display_name: kitchenName,
    area: profile.area as string | null | undefined,
    collection_address: profile.collection_address as string | null | undefined,
    paynow_mobile: profile.paynow_mobile as string | null | undefined,
    paynow_uen: profile.paynow_uen as string | null | undefined,
    payout_legal_name: profile.payout_legal_name as string | null | undefined,
    kitchen_halal_certified:
      profile.kitchen_halal_certified === null || profile.kitchen_halal_certified === undefined
        ? null
        : Boolean(profile.kitchen_halal_certified),
    availability_paused: Boolean(profile.availability_paused),
    responsible_person_name: profile.responsible_person_name as string | null | undefined,
  };

  const setupItems = buildCookDashboardSetupItems({
    profile: snapshot,
    listingCount,
    complianceVerified,
    paynowConfigured,
  });
  const incomplete = cookDashboardIncompleteSetup(setupItems);
  const halalLabel =
    snapshot.kitchen_halal_certified === true
      ? 'Halal certified'
      : snapshot.kitchen_halal_certified === false
        ? 'Not halal certified'
        : 'Halal not set';

  const recentOrders = (() => {
    const prioritized = [
      ...needsCook,
      ...activeOrders.filter((o) => !needsCook.some((n) => n.id === o.id)),
    ];
    const list = prioritized.length ? prioritized : orderList;
    return list.slice(0, 4);
  })();

  return (
    <DirectionalTabScreen testID="cook-dashboard-tab-scene">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
        ]}
        testID="cook-dashboard"
      >
        <GourmeatCookHeader
          title={greeting}
          subtitle={cookDashboardKitchenSubtitle(snapshot, user?.name || 'Chef')}
          testID="cook-dashboard-hero"
        />

        <SHCFadeIn delay={40}>
          <Pressable
            onPress={() => router.push('/(cook)/settings' as any)}
            style={styles.kitchenCard}
            testID="cook-kitchen-settings-link"
            accessibilityRole="button"
            accessibilityLabel="Kitchen settings"
          >
            <View style={styles.kitchenCardTop}>
              <Text style={styles.kitchenCardTitle}>{kitchenName || 'Your kitchen'}</Text>
              <SHCBadge variant={snapshot.availability_paused ? 'default' : 'success'}>
                {snapshot.availability_paused ? 'Paused' : 'Open'}
              </SHCBadge>
            </View>
            <Text style={styles.kitchenAddress}>{cookDashboardAddressLine(snapshot)}</Text>
            <View style={styles.chipRow}>
              <SHCMetaBadge kind="label">{String(snapshot.area || 'Area').trim() || 'Area'}</SHCMetaBadge>
              <SHCMetaBadge kind="label">{paynowConfigured ? 'PayNow ready' : 'PayNow missing'}</SHCMetaBadge>
              <SHCMetaBadge kind="label">{halalLabel}</SHCMetaBadge>
              <SHCMetaBadge kind="label">
                {complianceVerified ? 'SFA/WSQ verified' : 'Certs pending'}
              </SHCMetaBadge>
            </View>
            <Text style={styles.kitchenHint}>Tap to edit profile · collection · pause orders</Text>
          </Pressable>
        </SHCFadeIn>

        <SHCFadeIn delay={80}>
          <Text style={styles.sectionLabel}>At a glance</Text>
          <View style={styles.statRow}>
            <StatCell
              label="This week"
              value={earningsLabel}
              iconKey="earnings"
              tone="mint"
              onPress={() => router.push('/(cook)/earnings' as any)}
            />
            <StatCell
              label="Active orders"
              value={activeOrders.length}
              loading={ordersLoading}
              iconKey="orders"
              tone="peach"
              onPress={() => router.push('/(cook)/orders' as any)}
            />
            <StatCell
              label="Menu"
              value={listingCount}
              loading={listingsLoading}
              iconKey="listings"
              tone="yellow"
              onPress={() => router.push('/(cook)/listings' as any)}
            />
          </View>
        </SHCFadeIn>

        {incomplete.length > 0 ? (
          <SHCFadeIn delay={100}>
            <Text style={styles.sectionLabel}>Finish kitchen setup</Text>
            <View style={styles.setupCard}>
              {incomplete.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.href as any)}
                  style={styles.setupRow}
                  accessibilityRole="button"
                  testID={`cook-setup-${item.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.setupTitle}>{item.label}</Text>
                    <Text style={styles.setupDetail}>{item.detail}</Text>
                  </View>
                  <Text style={styles.setupChevron}>›</Text>
                </Pressable>
              ))}
            </View>
          </SHCFadeIn>
        ) : null}

        {needsCook.length > 0 ? (
          <Pressable
            onPress={() => router.push('/(cook)/orders' as any)}
            style={styles.attentionBanner}
            accessibilityRole="button"
            testID="cook-orders-need-action"
          >
            <Text style={styles.attentionTitle}>
              {needsCook.length} order{needsCook.length === 1 ? '' : 's'} need your action
            </Text>
            <Text style={styles.attentionSub}>Accept or decline so customers can move forward</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/(cook)/dashboard/requests' as any)}
          style={styles.collabLink}
          testID="collab-board-link"
          accessibilityRole="button"
        >
          <Text style={styles.collabLinkTitle}>Custom requests</Text>
          <Text style={styles.collabLinkBody}>
            {reqsLoading
              ? 'Loading open requests…'
              : reqCount > 0
                ? `${reqCount} open — browse and send a quote`
                : 'Dish requests from customers — any cook can quote'}
          </Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Kitchen tools</Text>
        <View style={styles.toolsGrid}>
          {toolTiles.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => router.push(action.mobile_href as any)}
              style={styles.toolChip}
              accessibilityRole="button"
              testID={action.id === 'cooking-soon' ? 'cook-cooking-soon-banner' : `cook-tool-${action.id}`}
            >
              <SHCBentoIconBadge iconKey={action.icon_key} size={20} />
              <Text style={styles.toolChipLabel}>{action.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push('/(cook)/tiffin' as any)}
            style={styles.toolChip}
            testID="cook-tiffin-ops-banner"
            accessibilityRole="button"
          >
            <SHCBentoIconBadge iconKey="home" size={20} />
            <Text style={styles.toolChipLabel}>Tiffin OS</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(cook)/earnings' as any)}
            style={styles.toolChip}
            accessibilityRole="button"
          >
            <SHCBentoIconBadge iconKey="earnings" size={20} />
            <Text style={styles.toolChipLabel}>Earnings</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabelFlush}>Orders</Text>
          <Pressable onPress={() => router.push('/(cook)/orders' as any)} accessibilityRole="button">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {ordersLoading && orderList.length === 0 && (
          <View style={{ marginBottom: shcSpacing.md }}>
            <SHCSkeletonBone height={88} radius={shcRadii.lg} style={{ marginBottom: 8 }} />
            <SHCSkeletonBone height={88} radius={shcRadii.lg} />
          </View>
        )}
        {!ordersLoading && orderList.length === 0 && (
          <View style={styles.noOrders}>
            <SHCFoodImage uri={BENTO_ACTION_IMAGES.orders} height={64} rounded={shcRadii.md} />
            <SHCBadge variant="default">No orders yet</SHCBadge>
            <Text style={styles.emptyHint}>
              {listingCount === 0
                ? 'Add a dish to your menu so neighbours can order.'
                : 'When customers order, they show up here.'}
            </Text>
          </View>
        )}
        {(recentOrders.length ? recentOrders : orderList.slice(0, 4)).map((o: any) => (
          <Link key={o.id} href={`/(cook)/orders/${o.id}` as any} asChild>
            <Pressable style={styles.orderCard} testID={`order-card-${o.id}`}>
              <SHCFoodImage
                uri={getDishImageUrl({ name: o.items?.[0]?.name })}
                width={72}
                height={72}
                rounded={shcRadii.md}
              />
              <View style={styles.orderInfo}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderDish} numberOfLines={1}>
                    {o.items?.[0]?.name || 'Order'}
                  </Text>
                  <OrderStatusBadge status={o.shc_status} />
                </View>
                <View style={styles.orderBadges}>
                  <SHCMetaBadge kind="price">S${o.total}</SHCMetaBadge>
                  {o.collection_date ? (
                    <SHCMetaBadge kind="cook_date">{o.collection_date}</SHCMetaBadge>
                  ) : null}
                </View>
              </View>
              <Text style={styles.orderChevron}>›</Text>
            </Pressable>
          </Link>
        ))}

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
  kitchenCard: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: gourmeatColors.surface,
    ...shcShadows.brutalSm,
  },
  kitchenCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kitchenCardTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: shcColors.text },
  kitchenAddress: { marginTop: 6, fontSize: 13, fontWeight: '600', color: shcColors.textLight, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: shcSpacing.sm },
  kitchenHint: { marginTop: shcSpacing.sm, fontSize: 11, fontWeight: '700', color: gourmeatColors.primary },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: shcColors.text,
    marginBottom: shcSpacing.sm,
    marginTop: shcSpacing.sm,
  },
  sectionLabelFlush: { fontSize: 13, fontWeight: '800', color: shcColors.text },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  seeAll: { fontSize: 13, fontWeight: '800', color: gourmeatColors.primary },
  statRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  statCell: {
    flex: 1,
    padding: shcSpacing.sm,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    minHeight: 96,
    ...shcShadows.brutalSm,
  },
  statNum: { fontSize: 18, fontWeight: '900', color: shcColors.text, marginTop: 6 },
  statLabel: { fontSize: 11, color: shcColors.textLight, fontWeight: '700', marginTop: 2 },
  setupCard: {
    marginBottom: shcSpacing.md,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.bentoPeach || '#FFE8DE',
    overflow: 'hidden',
    ...shcShadows.brutalSm,
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: shcSpacing.md,
    paddingVertical: shcSpacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: shcColors.border,
  },
  setupTitle: { fontSize: 14, fontWeight: '800', color: shcColors.text },
  setupDetail: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2 },
  setupChevron: { fontSize: 22, fontWeight: '800', color: gourmeatColors.primary },
  attentionBanner: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.bentoYellow || '#FFF3C4',
    ...shcShadows.brutalSm,
  },
  attentionTitle: { fontSize: 15, fontWeight: '900', color: shcColors.text },
  attentionSub: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginTop: 2 },
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
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  toolChip: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: gourmeatColors.surface,
    ...shcShadows.brutalSm,
  },
  toolChipLabel: { fontSize: 13, fontWeight: '800', color: shcColors.text, flexShrink: 1 },
  noOrders: { alignItems: 'center', paddingVertical: shcSpacing.md, gap: shcSpacing.sm },
  emptyHint: {
    fontSize: 12,
    fontWeight: '600',
    color: shcColors.textLight,
    textAlign: 'center',
    paddingHorizontal: shcSpacing.lg,
  },
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
  logoutBtn: {
    marginTop: shcSpacing.md,
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
