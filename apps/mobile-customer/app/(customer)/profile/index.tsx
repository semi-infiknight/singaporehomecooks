import React, { useState, useEffect } from 'react';
import { Text, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  shcColors,
  SHCCard,
  SHCButton,
  SHCButtonText,
  WalletCard,
  RequestDishForm,
  SHCProfileHero,
  SHCVisualBentoTile,
  SHCIcon,
  shcSpacing,
  shcBorders,
  shcRadii,
  GourmeatScreenHeader,
  gourmeatColors,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, favoritesToReorderDishes } from '@shc/utils';
import { useFavorites } from '../../../hooks/useFavorites';
import { SHCZomatoDishRowRail } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useCredits, useRedeemCredits } from '../../../hooks/useProducts';
import { useCreateRequest, useNotifications } from '../../../hooks/useOrder';

const QUICK_TILES = [
  { iconKey: 'orders' as const, label: 'Orders', image: BENTO_ACTION_IMAGES.orders, href: '/(customer)/orders', testID: 'profile-orders-tile' },
  { iconKey: 'search' as const, label: 'Search', image: BENTO_ACTION_IMAGES.request, href: '/(customer)/search', testID: 'profile-search-tile' },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showRequest } = useLocalSearchParams<{ showRequest?: string }>();
  const { user, logout } = useAuth();
  const { data: credits } = useCredits();
  const redeemMut = useRedeemCredits();
  const createReqMut = useCreateRequest();
  const { data: notifs = [] } = useNotifications();
  const { favorites } = useFavorites();
  const savedDishes = favoritesToReorderDishes(favorites);
  const [showRequestModal, setShowRequestModal] = useState(showRequest === '1');
  useEffect(() => {
    if (showRequest === '1') setShowRequestModal(true);
  }, [showRequest]);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const bal = credits?.balance ?? 0;
  const spend = credits?.lifetimeSpend ?? 0;
  const tier = credits?.tier ?? 'Bronze';

  const handleLogout = async () => {
    await logout();
    router.replace('/(shared)/auth');
  };

  const handleRequestSubmit = async (data: any) => {
    try {
      const req = await createReqMut.mutateAsync(data);
      setRequestSuccess(`Request ${req.id} posted!`);
      setShowRequestModal(false);
      setTimeout(() => setRequestSuccess(null), 4000);
    } catch (e: any) {
      setRequestSuccess('Request failed (demo). ' + (e?.message || ''));
    }
  };

  return (
    <View style={styles.screen} testID="customer-profile-screen">
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.heroWrap}>
          <GourmeatScreenHeader
            title={user?.name || 'Guest'}
            subtitle={`${tier} tier · HDB home cook lover`}
          />
        </View>
        <Pressable
          onPress={() => setShowNotifs(!showNotifs)}
          testID="notif-bell"
          accessibilityLabel="Notifications"
          style={styles.bellBtn}
        >
          <SHCIcon name="notifications" size={22} color={shcColors.text} active={showNotifs} />
          {notifs.length > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellCount}>{notifs.length}</Text>
            </View>
          )}
        </Pressable>
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
        <View style={styles.tileCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.credits}
            iconKey="credits"
            label={`${bal} Credits`}
            variant="bento-yellow"
            testID="profile-credits-tile"
          />
        </View>
      </View>

      <WalletCard
        balance={bal}
        lifetimeSpend={spend}
        redeemable={Math.min(80, bal)}
        onRedeem={(amt) => redeemMut.mutate(amt)}
      />

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
            }))}
            onDishPress={(id) => router.push(`/(customer)/product/${id}` as any)}
            testID="profile-saved-rail"
          />
        </View>
      )}

      {requestSuccess && (
        <SHCCard variant="bento-mint" style={styles.successCard}>
          <View style={styles.successRow}>
            <SHCIcon name="checkmark" size={16} color={shcColors.success} active />
            <Text style={styles.successText}>{requestSuccess}</Text>
          </View>
        </SHCCard>
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
      <Link href="/(shared)/onboarding" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="trust-safety-link">
          <SHCButtonText variant="outline">Trust & Safety</SHCButtonText>
        </SHCButton>
      </Link>
      <Link href="/(customer)/search" asChild>
        <SHCButton variant="outline" style={styles.actionBtn} testID="advanced-search-link">
          <SHCButtonText>Advanced Search</SHCButtonText>
        </SHCButton>
      </Link>

      <Pressable
        onPress={() => setShowRequestModal(true)}
        testID="open-request-modal-btn"
        accessibilityRole="button"
        style={[styles.actionBtn, styles.requestBtn]}
      >
        <Text style={styles.requestBtnText}>Request Custom Dish</Text>
      </Pressable>

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
          {notifs.map((n: any, i: number) => (
            <Text key={i} style={styles.notifItem}>
              {n.body}
            </Text>
          ))}
        </SHCCard>
      )}

      {showRequestModal && (
        <View testID="request-modal" style={styles.requestPanel}>
          <RequestDishForm onSubmit={handleRequestSubmit} onClose={() => setShowRequestModal(false)} />
        </View>
      )}
    </ScrollView>
    </View>
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
  bellIcon: { fontSize: 20 },
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
  successCard: { marginTop: shcSpacing.sm },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  successText: { color: shcColors.success, fontWeight: '600', flex: 1 },
  trustCard: { marginTop: shcSpacing.md, alignItems: 'center' },
  savedTitle: { fontSize: 16, fontWeight: '900', color: shcColors.text },
  savedSub: { fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginBottom: shcSpacing.sm },
  trustTitle: { fontWeight: '800', color: shcColors.primary, marginTop: 4 },
  trustBody: { fontSize: 12, color: shcColors.textLight, textAlign: 'center', marginTop: 4 },
  actionBtn: { marginTop: shcSpacing.sm },
  requestBtn: {
    backgroundColor: shcColors.primary,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.lg,
    alignItems: 'center',
  },
  requestBtnText: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 15 },
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
  requestPanel: { marginTop: shcSpacing.md },
});