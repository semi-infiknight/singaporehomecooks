// Customer profile (polished): dietary, credits, history links, trust copy from Content/Seed, earnings awareness.
// Phase 7-9: WalletCard + CreditBadge + RequestDishForm modal (posts to shc_request), in-app notifs bell, redeem preview. All embedded (no new route files).
import React, { useState } from 'react';
import { Text, ScrollView, View, Modal, Pressable } from 'react-native';
import { shcColors, SHCCard, SHCButton, SHCButtonText, WalletCard, RequestDishForm, SHCSectionTitle } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
import { Link } from 'expo-router';
import { useCredits, useRedeemCredits, useCreateRequest, useNotifications } from '../../../hooks/useProducts';
// Rich trust snippets from seed for onboarding/profile consistency
import { trustSnippets } from '../../../../../seed';

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: credits } = useCredits();
  const redeemMut = useRedeemCredits();
  const createReqMut = useCreateRequest();
  const { data: notifs = [] } = useNotifications();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const bal = credits?.balance ?? 45;
  const spend = credits?.lifetimeSpend ?? 320;
  const tier = credits?.tier ?? 'Bronze';

  const handleRequestSubmit = async (data: any) => {
    try {
      const req = await createReqMut.mutateAsync(data);
      setRequestSuccess(`Request ${req.id} posted! Cooks will bid on the Collaboration Board.`);
      setShowRequestModal(false);
      setTimeout(() => setRequestSuccess(null), 4000);
    } catch (e: any) {
      setRequestSuccess('Request failed (demo). ' + (e?.message || ''));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }} testID="customer-profile-screen">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: shcColors.text }}>Profile • {user.name}</Text>
        <Pressable onPress={() => setShowNotifs(!showNotifs)} testID="notif-bell" accessibilityLabel="Notifications bell, shows recent order/credit/request events" style={{ padding: 8 }}>
          <Text style={{ fontSize: 20 }}>🛎️</Text>
          {notifs.length > 0 && <Text style={{ position: 'absolute', top: 4, right: 4, fontSize: 9, color: shcColors.error }}>({notifs.length})</Text>}
        </Pressable>
      </View>

      {/* Phase 9 Growth: Wallet + Credits redeem + tier. SG-specific: earn on collected, redeem for family feasts */}
      <WalletCard
        balance={bal}
        lifetimeSpend={spend}
        redeemable={Math.min(80, bal)}
        onRedeem={(amt) => redeemMut.mutate(amt)}
      />

      {requestSuccess && <SHCCard style={{ marginTop: 8, backgroundColor: '#DCFCE7' }}><Text style={{ color: shcColors.success }}>{requestSuccess}</Text></SHCCard>}

      <SHCCard>
        <Text>Role: {user.role}. HDB home cook lover. Earn 5% credits on completed orders (12-month expiry). Redeem at checkout (auto or manual). Tier: {tier}</Text>
        <Text style={{ marginTop: 8, fontSize: 12 }}>Dietary prefs: (stub) — will filter on search. Allergen history tracked for safety.</Text>
      </SHCCard>

      <SHCCard style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '600', color: shcColors.primary }}>5-Layer Trust (from content)</Text>
        <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 4 }}>{trustSnippets.fiveLayersSummary}</Text>
        <Text style={{ marginTop: 6, fontSize: 11 }}>{trustSnippets.allergenNote}</Text>
      </SHCCard>

      <Link href="/(customer)/orders" asChild><SHCButton style={{ marginTop: 12 }}><SHCButtonText>View My Orders &amp; Track</SHCButtonText></SHCButton></Link>
      <Link href="/(shared)/onboarding" asChild><SHCButton variant="outline" style={{ marginTop: 8 }}><SHCButtonText>Revisit Onboarding &amp; Trust</SHCButtonText></SHCButton></Link>
      <Link href="/(customer)/search" asChild><SHCButton variant="outline" style={{ marginTop: 8 }} testID="advanced-search-link"><SHCButtonText>Advanced Search + Filters (synonyms + NL)</SHCButtonText></SHCButton></Link>

      <SHCSectionTitle style={{ marginTop: 12 }}>Differentiation</SHCSectionTitle>
      <SHCButton onPress={() => setShowRequestModal(true)} testID="open-request-modal-btn" style={{ marginBottom: 8 }}>
        <SHCButtonText>🍲 Request Custom Dish (Recipe Bidding)</SHCButtonText>
      </SHCButton>
      <Text style={{ fontSize: 11, color: shcColors.textLight, marginBottom: 8 }}>Post description + optional YT → cooks bid (see cook Collaboration Board) → accept creates order.</Text>

      <Text onPress={logout} style={{ color: shcColors.error, marginTop: 24, textAlign: 'center' }} accessibilityRole="button">Logout (dev — resets SecureStore)</Text>

      <Text style={{ marginTop: 24, fontSize: 11, color: shcColors.textLight, textAlign: 'center' }}>Earnings for cooks visible to you on checkout. Home Credits (Phase 9) + requests (Phase 8) live in mock.</Text>

      {/* Request modal */}
      <Modal visible={showRequestModal} animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
          <RequestDishForm onSubmit={handleRequestSubmit} onClose={() => setShowRequestModal(false)} />
        </ScrollView>
      </Modal>

      {/* Simple notif panel (stub bell) */}
      {showNotifs && (
        <SHCCard style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '600' }}>Recent (in-app bell stub)</Text>
          {notifs.length === 0 && <Text style={{ color: shcColors.textLight }}>No events. Place/complete order or request to see.</Text>}
          {notifs.map((n: any, i: number) => <Text key={i} style={{ fontSize: 12, marginTop: 4 }}>{n.body} ({new Date(n.created_at).toLocaleTimeString('en-SG')})</Text>)}
        </SHCCard>
      )}
    </ScrollView>
  );
}