import React, { useState, useEffect } from 'react';
import { Text, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  WalletCard,
  SHCVisualBentoTile,
  SHCIcon,
  SHCBadge,
  shcSpacing,
  shcBorders,
  shcRadii,
  GourmeatScreenHeader,
  SHCHeritageStoryBanner,
  DirectionalTabScreen,
  gourmeatColors,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, favoritesToReorderDishes } from '@shc/utils';
import { useFavorites } from '../../../hooks/useFavorites';
import { SHCZomatoDishRowRail } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useCredits, useRedeemCredits } from '../../../hooks/useProducts';
import { useAcceptBid, useBids, useMyRequests, useNotifications } from '../../../hooks/useOrder';
import { MobileLanguageSwitcher } from '../../../components/MobileLanguageSwitcher';
import { useShcI18n, getWalletProfileCopy } from '@shc/i18n';

const QUICK_TILE_DEFS = [
  { iconKey: 'orders' as const, labelKey: 'tab.orders' as const, image: BENTO_ACTION_IMAGES.orders, href: '/(customer)/orders', testID: 'profile-orders-tile' },
  { iconKey: 'search' as const, labelKey: 'wallet.advanced_search' as const, image: BENTO_ACTION_IMAGES.request, href: '/(customer)/search', testID: 'profile-search-tile' },
];

function MyRequestCard({ request }: { request: any }) {
  const { t } = useShcI18n();
  const { data: bids = [] } = useBids(request.id);
  const acceptBid = useAcceptBid();
  const pendingBids = bids.filter((bid: any) => bid.status === 'pending');

  return (
    <SHCCard style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle} numberOfLines={2}>{request.body}</Text>
        <SHCBadge variant={request.status === 'matched' ? 'success' : 'warning'}>{request.status}</SHCBadge>
      </View>
      <Text style={styles.requestMeta}>
        {request.party_size ? `${request.party_size} pax · ` : ''}{request.budget_cents ? `Budget S$${Math.round(request.budget_cents / 100)}` : t('wallet.open_budget')}
      </Text>
      {pendingBids.length === 0 && <Text style={styles.requestEmpty}>{t('wallet.no_pending_bids')}</Text>}
      {pendingBids.map((bid: any) => (
        <View key={bid.id} style={styles.bidRow}>
          <View style={styles.bidInfo}>
            <Text style={styles.bidPrice}>S${Math.round((bid.price_cents || 0) / 100)}</Text>
            {!!bid.message && <Text style={styles.bidMessage} numberOfLines={2}>{bid.message}</Text>}
          </View>
          <SHCButton
            onPress={() => acceptBid.mutate(bid.id)}
            disabled={acceptBid.isPending}
            style={styles.acceptBidBtn}
            testID={`accept-bid-${bid.id}`}
          >
            <SHCButtonText>{t('wallet.accept')}</SHCButtonText>
          </SHCButton>
        </View>
      ))}
    </SHCCard>
  );
}

export default function Profile() {
  const { t, locale } = useShcI18n();
  const profileCopy = getWalletProfileCopy(locale);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showRequest } = useLocalSearchParams<{ showRequest?: string }>();
  const { user, logout } = useAuth();
  const { data: credits } = useCredits() as {
    data?: { balance?: number; lifetimeSpend?: number; tier?: string };
  };
  const redeemMut = useRedeemCredits();
  const { data: notifs = [], markRead } = useNotifications();
  const { data: myRequests = [] } = useMyRequests();
  const { favorites } = useFavorites();
  const savedDishes = favoritesToReorderDishes(favorites);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (showRequest === '1') {
      router.replace('/(customer)/request' as any);
    }
  }, [showRequest, router]);

  const bal = credits?.balance ?? 0;
  const spend = credits?.lifetimeSpend ?? 0;
  const tier = credits?.tier ?? 'Bronze';

  const handleLogout = async () => {
    await logout();
    router.replace('/(shared)/auth');
  };

  return (
    <DirectionalTabScreen testID="profile-tab-scene">

    <View style={styles.screen} testID="customer-profile-screen">
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.heroWrap}>
          <GourmeatScreenHeader
            title={user?.name || profileCopy.guest}
            subtitle={profileCopy.subtitle(tier)}
          />
        </View>
        <Pressable
          onPress={() => {
            const next = !showNotifs;
            setShowNotifs(next);
            if (next && notifs.some((n: any) => !n.read)) {
              markRead({ all: true });
            }
          }}
          testID="notif-bell"
          accessibilityLabel={profileCopy.notificationsA11y}
          style={styles.bellBtn}
        >
          <SHCIcon name="notifications" size={22} color={gourmeatColors.text} active={showNotifs} />
          {notifs.filter((n: any) => !n.read).length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellCount}>{notifs.filter((n: any) => !n.read).length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <MobileLanguageSwitcher />

      <View style={styles.tilesRow}>
        {QUICK_TILE_DEFS.map((tile) => (
          <View key={tile.testID} style={styles.tileCol}>
            <Link href={tile.href as any} asChild>
              <SHCVisualBentoTile
                imageUri={tile.image}
                iconKey={tile.iconKey}
                label={t(tile.labelKey)}
                testID={tile.testID}
                variant="bento-mint"
              />
            </Link>
          </View>
        ))}
        <View style={styles.tileCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.credits}
            iconKey="credits"
            label={t('wallet.credits_tile').replace('{balance}', String(bal))}
            variant="bento-yellow"
            testID="profile-credits-tile"
          />
        </View>
      </View>

      <SHCHeritageStoryBanner
        imageUri={BENTO_ACTION_IMAGES.compliance}
        onPress={() => router.push('/(shared)/onboarding' as any)}
      />

      <WalletCard
        balance={bal}
        lifetimeSpend={spend}
        redeemable={Math.min(80, bal)}
        onRedeem={(amt) => redeemMut.mutate(amt)}
      />

      {myRequests.length > 0 && (
        <View style={styles.requestsSection} testID="my-requests-panel">
          <Text style={styles.savedTitle}>{t('wallet.my_requests')}</Text>
          <Text style={styles.savedSub}>{t('wallet.my_requests_sub')}</Text>
          {myRequests.map((request: any) => (
            <MyRequestCard key={request.id} request={request} />
          ))}
        </View>
      )}

      {savedDishes.length > 0 && (
        <View style={{ marginTop: shcSpacing.md }}>
          <Text style={styles.savedTitle}>{t('wallet.saved_dishes')}</Text>
          <Text style={styles.savedSub}>{t('wallet.saved_sub')}</Text>
          <SHCZomatoDishRowRail
            title=""
            dishes={savedDishes.map((d) => ({
              id: d.id,
              name: d.name,
              cook_name: d.cook_name || '',
              price: d.price,
              cuisine: d.cuisine,
            }))}
            onDishPress={(id) => router.push(`/(customer)/product/${id}` as any)}
            testID="profile-saved-rail"
          />
        </View>
      )}

      <SHCCard variant="bento-peach" style={styles.trustCard}>
        <SHCIcon name="compliance" size={28} color={gourmeatColors.primary} active />
        <Text style={styles.trustTitle}>{t('wallet.trust_card_title')}</Text>
        <Text style={styles.trustBody}>{t('wallet.trust_card_body')}</Text>
      </SHCCard>

      <Link href="/(customer)/orders" asChild>
        <SHCButton style={styles.actionBtn}>
          <SHCButtonText>{t('wallet.view_orders')}</SHCButtonText>
        </SHCButton>
      </Link>
      <Link href="/(shared)/onboarding" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="trust-safety-link">
          <SHCButtonText variant="outline">{t('nav.trust_safety')}</SHCButtonText>
        </SHCButton>
      </Link>
      <Link href="/(customer)/search" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="advanced-search-link">
          <SHCButtonText variant="outline">{t('wallet.advanced_search')}</SHCButtonText>
        </SHCButton>
      </Link>

      <Pressable
        onPress={handleLogout}
        style={styles.logoutBtn}
        testID="logout-btn"
        accessibilityRole="button"
        accessibilityLabel={t('wallet.logout')}
      >
        <Text style={styles.logout}>{t('wallet.logout')}</Text>
      </Pressable>

      {showNotifs && (
        <SHCCard style={styles.notifsCard}>
          <View style={styles.notifsTitleRow}>
            <SHCIcon name="notifications" size={18} color={gourmeatColors.text} active />
            <Text style={styles.notifsTitle}>{t('wallet.notifications')}</Text>
          </View>
          {notifs.length === 0 && <Text style={styles.notifsEmpty}>{t('wallet.no_events')}</Text>}
          {notifs.map((n: any, i: number) => (
            <Text key={i} style={[styles.notifItem, !n.read && styles.notifUnread]}>
              {!n.read ? '● ' : ''}{n.body}
            </Text>
          ))}
        </SHCCard>
      )}
    </ScrollView>
    </View>
  
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  heroWrap: { flex: 1 },
  bellBtn: {
    padding: shcSpacing.sm,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: gourmeatColors.surface,
    marginTop: shcSpacing.md,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: gourmeatColors.error,
    borderRadius: shcRadii.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCount: { fontSize: 9, color: gourmeatColors.onPrimary, fontWeight: '800' },
  tilesRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  tileCol: { flex: 1 },
  trustCard: { marginTop: shcSpacing.md, alignItems: 'center' },
  requestsSection: { marginTop: shcSpacing.md },
  requestCard: { marginTop: shcSpacing.sm },
  requestHeader: { flexDirection: 'row', gap: shcSpacing.sm, alignItems: 'flex-start' },
  requestTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: gourmeatColors.text },
  requestMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight, fontWeight: '600' },
  requestEmpty: { marginTop: shcSpacing.sm, fontSize: 12, color: gourmeatColors.textLight },
  bidRow: {
    marginTop: shcSpacing.sm,
    paddingTop: shcSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: shcSpacing.sm,
  },
  bidInfo: { flex: 1 },
  bidPrice: { fontSize: 14, fontWeight: '900', color: gourmeatColors.primary },
  bidMessage: { marginTop: 2, fontSize: 12, color: gourmeatColors.textLight },
  acceptBidBtn: { paddingHorizontal: shcSpacing.sm },
  savedTitle: { fontSize: 16, fontWeight: '900', color: gourmeatColors.text },
  savedSub: { fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  trustTitle: { fontWeight: '800', color: gourmeatColors.primary, marginTop: 4 },
  trustBody: { fontSize: 12, color: gourmeatColors.textLight, textAlign: 'center', marginTop: 4 },
  actionBtn: { marginTop: shcSpacing.sm },
  logoutBtn: {
    marginTop: shcSpacing.lg,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.lg,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.error,
    borderRadius: shcRadii.md,
    backgroundColor: gourmeatColors.primaryLight,
    alignItems: 'center',
  },
  logout: { color: gourmeatColors.error, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  notifsCard: { marginTop: shcSpacing.md },
  notifsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifsTitle: { fontWeight: '800', color: gourmeatColors.text },
  notifsEmpty: { color: gourmeatColors.textLight, fontSize: 12 },
  notifItem: { fontSize: 12, marginTop: 4, color: gourmeatColors.text },
  notifUnread: { fontWeight: '700', color: gourmeatColors.primary },
});
