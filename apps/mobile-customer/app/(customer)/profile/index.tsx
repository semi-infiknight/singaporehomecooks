import React, { useState, useEffect } from 'react';
import { Text, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  shcColors,
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  SHCIcon,
  shcSpacing,
  shcBorders,
  shcRadii,
  GourmeatScreenHeader,
  DirectionalTabScreen,
  SHCSkeletonAccountScreen,
  contentPadForTabBar,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  favoritesToReorderDishes,
  getDishImageUrl,
  accountMenuItemsSignedIn,
  accountMenuItemsGuest,
  orderIdFromNotificationType,
} from '@shc/utils';
import { useFavorites } from '../../../hooks/useFavorites';
import { SHCZomatoDishRowRail } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useNotifications } from '../../../hooks/useOrder';

const QUICK_TILES = [
  { iconKey: 'orders' as const, label: 'Orders', image: BENTO_ACTION_IMAGES.orders, href: '/(customer)/orders', testID: 'profile-orders-tile' },
  { iconKey: 'home' as const, label: 'Tiffin', image: BENTO_ACTION_IMAGES.checkout, href: '/(customer)/tiffin', testID: 'profile-tiffin-tile' },
  { iconKey: 'search' as const, label: 'Search', image: BENTO_ACTION_IMAGES.request, href: '/(customer)/search', testID: 'profile-search-tile' },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showRequest } = useLocalSearchParams<{ showRequest?: string }>();
  const { user, logout, loading: authLoading } = useAuth();
  const { data: notifs = [], markRead } = useNotifications();
  const { favorites } = useFavorites();
  const savedDishes = favoritesToReorderDishes(favorites);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (showRequest === '1') {
      router.replace('/(customer)/request' as any);
    }
  }, [showRequest, router]);

  const guestProfile = (
    <>
      <GourmeatScreenHeader title="Account" subtitle="Sign in for orders and account tools" />
      <SHCCard variant="bento-peach" style={styles.trustCard} testID="guest-profile-gate">
        <SHCIcon name="profile" size={28} color={shcColors.primary} active />
        <Text style={styles.trustTitle}>You are exploring freely</Text>
        <Text style={styles.trustBody}>
          Discover kitchens and dishes on Home. Orders and account tools only appear after you sign in.
        </Text>
      </SHCCard>
      <SHCButton
        style={styles.actionBtn}
        onPress={() => router.push('/(shared)/auth' as any)}
        testID="guest-profile-signin"
      >
        <SHCButtonText>Sign Up / Log In</SHCButtonText>
      </SHCButton>
      <View style={styles.accountMenu} testID="account-menu-list">
      {accountMenuItemsGuest()
        .filter((i) => i.id !== 'login')
        .map((item) => (
          <Pressable
            key={item.id}
            style={styles.accountMenuRow}
            onPress={() => {
              if (item.id === 'browse') router.replace('/(customer)' as any);
              else if (item.id === 'tiffin') router.push('/(customer)/tiffin' as any);
            }}
            testID={item.testID}
          >
            <Text style={styles.accountMenuLabel}>{item.label}</Text>
            <Text style={styles.accountMenuChevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/(shared)/auth');
  };

  if (authLoading) {
    return (
      <DirectionalTabScreen testID="profile-tab-scene">
        <View style={styles.screen} testID="customer-profile-screen">
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.content,
              { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
            ]}
          >
            <SHCSkeletonAccountScreen />
          </ScrollView>
        </View>
      </DirectionalTabScreen>
    );
  }

  // Guest browse: no wallet / orders / logout — sign in or keep exploring home
  if (!user) {
    return (
      <DirectionalTabScreen testID="profile-tab-scene">
        <View style={styles.screen} testID="customer-profile-screen">
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.content,
              { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
            ]}
          >
            {guestProfile}
          </ScrollView>
        </View>
      </DirectionalTabScreen>
    );
  }

  return (
    <DirectionalTabScreen testID="profile-tab-scene">

    <View style={styles.screen} testID="customer-profile-screen">
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.heroWrap}>
          <GourmeatScreenHeader
            title="Account"
            subtitle={user.name || 'You'}
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
          accessibilityLabel="Notifications"
          style={styles.bellBtn}
        >
          <SHCIcon name="notifications" size={22} color={shcColors.text} active={showNotifs} />
          {notifs.filter((n: any) => !n.read).length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellCount}>{notifs.filter((n: any) => !n.read).length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Wireframe Account menu */}
      <View style={styles.accountMenu} testID="account-menu-list">
        {accountMenuItemsSignedIn().map((item) => (
          <Pressable
            key={item.id}
            style={styles.accountMenuRow}
            onPress={() => {
              const map: Record<string, string> = {
                profile: '/(customer)/profile',
                subscriptions: '/(customer)/tiffin/subscriptions',
                orders: '/(customer)/orders',
                address: '/(customer)/location',
                requests: '/(customer)/request',
              };
              router.push((map[item.id] || '/(customer)/profile') as any);
            }}
            testID={item.testID}
          >
            <Text style={styles.accountMenuLabel}>{item.label}</Text>
            <Text style={styles.accountMenuChevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.tilesRow}>
        {QUICK_TILES.map((t) => (
          <View key={t.label} style={styles.tileCol}>
            <Link href={t.href as any} asChild>
              <SHCVisualBentoTile
                imageUri={t.image}
                iconKey={t.iconKey}
                label={t.label}
                testID={t.testID}
                variant="bento-mint"
              />
            </Link>
          </View>
        ))}
      </View>

      {savedDishes.length > 0 && (
        <View style={{ marginTop: shcSpacing.md }}>
          <Text style={styles.savedTitle}>Saved dishes</Text>
          <Text style={styles.savedSub}>Tap a dish to order again</Text>
          <SHCZomatoDishRowRail
            title=""
            dishes={savedDishes.map((d) => ({
              id: d.id,
              name: d.name,
              cook_name: d.cook_name || '',
              price: d.price,
              cuisine: d.cuisine,
              image_url: getDishImageUrl({ id: d.id, name: d.name, cuisine: d.cuisine }),
            }))}
            onDishPress={(id) => router.push(`/(customer)/product/${id}` as any)}
            testID="profile-saved-rail"
          />
        </View>
      )}

      <SHCCard variant="bento-peach" style={styles.trustCard}>
        <SHCIcon name="compliance" size={28} color={shcColors.primary} active />
        <Text style={styles.trustTitle}>5-Layer Trust</Text>
        <Text style={styles.trustBody}>Verified cooks · allergen disclosure · HDB collection · PayNow escrow</Text>
      </SHCCard>

      <Link href="/(customer)/orders" asChild>
        <SHCButton style={styles.actionBtn}>
          <SHCButtonText>View My Orders</SHCButtonText>
        </SHCButton>
      </Link>
      <Link href="/(customer)/tiffin/subscriptions" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="profile-subscriptions-link">
          <SHCButtonText variant="outline">My Subscriptions</SHCButtonText>
        </SHCButton>
      </Link>
      <Link href="/(customer)/search" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="advanced-search-link">
          <SHCButtonText>Advanced Search</SHCButtonText>
        </SHCButton>
      </Link>

      <Pressable
        onPress={handleLogout}
        style={styles.logoutBtn}
        testID="logout-btn"
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text style={styles.logout}>Logout</Text>
      </Pressable>

      {showNotifs && (
        <SHCCard style={styles.notifsCard}>
          <View style={styles.notifsTitleRow}>
            <SHCIcon name="notifications" size={18} color={shcColors.text} active />
            <Text style={styles.notifsTitle}>Notifications</Text>
          </View>
          {notifs.length === 0 && <Text style={styles.notifsEmpty}>No events yet</Text>}
          {notifs.map((n: any, i: number) => {
            const orderId = orderIdFromNotificationType(n.type);
            const row = (
              <Text style={[styles.notifItem, !n.read && styles.notifUnread]}>
                {!n.read ? '● ' : ''}{n.body}
              </Text>
            );
            return orderId ? (
              <Pressable
                key={n.id || i}
                onPress={() => router.push(`/(customer)/orders/${orderId}` as any)}
                testID={`notif-order-${orderId}`}
              >
                {row}
              </Pressable>
            ) : (
              <View key={n.id || i}>{row}</View>
            );
          })}
        </SHCCard>
      )}
    </ScrollView>
    </View>
  
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  heroWrap: { flex: 1 },
  bellBtn: {
    padding: shcSpacing.sm,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surface,
    marginTop: shcSpacing.md,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: shcColors.error,
    borderRadius: shcRadii.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCount: { fontSize: 9, color: '#fff', fontWeight: '800' },
  tilesRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  tileCol: { flex: 1 },
  accountMenu: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.lg,
    backgroundColor: shcColors.surface,
    marginBottom: shcSpacing.md,
    overflow: 'hidden',
  },
  accountMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: shcSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: shcColors.border,
  },
  accountMenuLabel: { fontSize: 14, fontWeight: '700', color: shcColors.text },
  accountMenuChevron: { fontSize: 18, fontWeight: '300', color: shcColors.textLight },
  trustCard: { marginTop: shcSpacing.md, alignItems: 'center' },
  savedTitle: { fontSize: 16, fontWeight: '900', color: shcColors.text },
  savedSub: { fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginBottom: shcSpacing.sm },
  trustTitle: { fontWeight: '800', color: shcColors.primary, marginTop: 4 },
  trustBody: { fontSize: 12, color: shcColors.textLight, textAlign: 'center', marginTop: 4 },
  actionBtn: { marginTop: shcSpacing.sm },
  logoutBtn: {
    marginTop: shcSpacing.lg,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.lg,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.error,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surfaceError,
    alignItems: 'center',
  },
  logout: { color: shcColors.error, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  notifsCard: { marginTop: shcSpacing.md },
  notifsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifsTitle: { fontWeight: '800' },
  notifsEmpty: { color: shcColors.textLight, fontSize: 12 },
  notifItem: { fontSize: 12, marginTop: 4 },
  notifUnread: { fontWeight: '700', color: shcColors.primary },
});