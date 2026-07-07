import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import {
  SHCCard,
  CollectionSlotPicker,
  PayNowPanel,
  AllergenAckCheckbox,
  SHCErrorBanner,
  SHCSectionTitle,
  CreditBadge,
  shcSpacing,
  gourmeatRadii,
  SHCFadeIn,
  GourmeatPayButton,
  GourmeatOrderSummaryCard,
  GourmeatPaymentMethodRow,
  GourmeatPrimaryButton,
  GourmeatScreenHeader,
  gourmeatColors,
  SHCCartPageHero,
  SHCButton,
  SHCButtonText,
  useSHCTray,
  SHCCelebration,
  useMilestoneCelebration,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, getFirstCartProductId, resolveCartForDisplay } from '@shc/utils';
import { useCart, useCredits } from '../../hooks/useProducts';
import { useCollectionSlots } from '../../hooks/useProducts';
import { transitionOrder, checkoutWithCredits, flagCorporateOrder } from '../../lib/api-client';
import { SHCErrorCode } from '@shc/types';
import { enforceMinimumOrder } from '@shc/business-rules';
import { useShcI18n, getCheckoutScreenCopy } from '@shc/i18n';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { formatLocationLabel } from '@shc/utils';

function AllergenGateTrayContent({
  allergens,
  tier1,
  onConfirm,
}: {
  allergens?: string[];
  tier1?: string[];
  onConfirm: () => void;
}) {
  const { t } = useShcI18n();
  const [localAck, setLocalAck] = useState(false);

  return (
    <View>
      <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm, lineHeight: 18 }}>
        {t('checkout.allergen_gate_body')}
      </Text>
      <AllergenAckCheckbox checked={localAck} onChange={setLocalAck} allergens={allergens} tier1={tier1} />
      <GourmeatPrimaryButton
        label={t('checkout.allergen_confirm')}
        onPress={onConfirm}
        disabled={!localAck}
        style={{ marginTop: shcSpacing.md }}
        testID="allergen-tray-confirm"
      />
    </View>
  );
}

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, locale } = useShcI18n();
  const checkoutCopy = getCheckoutScreenCopy(locale);
  const { user, loading: authLoading } = useAuth();
  const { active: collectionLocation } = useCustomerLocation();
  const { openTray, dismiss } = useSHCTray();
  const milestoneStorage = useMemo(
    () => ({
      get: SecureStore.getItemAsync,
      set: SecureStore.setItemAsync,
    }),
    []
  );
  const firstOrderMilestone = useMilestoneCelebration('first_order', user?.id || user?.name || 'anon', milestoneStorage);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(shared)/auth' as any);
    }
  }, [authLoading, user, router]);
  const { data: cartRaw = { items: [] } } = useCart();
  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const cart = useMemo(
    () => resolveCartForDisplay(cartRaw as { items: Array<Record<string, unknown>> }, { dev: __DEV__, maestroE2e }),
    [cartRaw, maestroE2e]
  );
  const [allergenAck, setAllergenAck] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: string } | null>(null);
  const [error, setError] = useState<null | { code?: SHCErrorCode; message: string }>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: creditsData } = useCredits() as { data?: { balance?: number; tier?: string } };
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [isCorporate, setIsCorporate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paynow');
  const creditBal = creditsData?.balance || 0;

  const firstProdId = getFirstCartProductId(cart.items || []);
  const { data: slots = [] } = useCollectionSlots(firstProdId || 'dish_nasi_lemak_prawn_001');
  const total = (cart.items || []).reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const amountDue = Math.max(0, total - Math.floor(creditsToApply / 4));
  const handlePaymentSelect = (method: string) => {
    setPaymentMethod(method);
    if (method === 'credits' && creditBal > 0) setCreditsToApply(Math.min(80, creditBal));
    else if (method === 'paynow') setCreditsToApply(0);
  };
  const itemCount = (cart.items || []).reduce((s: number, i: any) => s + i.qty, 0);

  const handleSlot = (date: string, slot: string) => setSelectedSlot({ date, slot });

  const openAllergenTray = useCallback(() => {
    openTray(
      { id: 'allergen-gate', title: t('checkout.allergen_section'), height: 'medium' },
      <AllergenGateTrayContent
        allergens={(cart.items[0] as any)?.allergens}
        tier1={[checkoutCopy.tier1Typical]}
        onConfirm={() => {
          setAllergenAck(true);
          dismiss();
        }}
      />
    );
  }, [cart.items, checkoutCopy.tier1Typical, dismiss, openTray, t]);

  const handleCheckout = async () => {
    setError(null);
    if (!allergenAck) {
      openAllergenTray();
      setError({ code: 'SHC-CART-003', message: checkoutCopy.errorAllergenRequired });
      return;
    }
    if (!pdpaConsent) {
      setError({ code: 'SHC-GENERIC-001', message: checkoutCopy.errorPdpaRequired });
      return;
    }
    if (!selectedSlot) {
      setError({ code: 'SHC-AVAIL-001', message: checkoutCopy.errorSlotRequired });
      return;
    }
    const totalCents = Math.round(total * 100);
    const minimumCheck = enforceMinimumOrder({
      totalCents,
      lines: (cart.items || []).map((i: { price?: number }) => ({ price_cents: Math.round(Number(i.price || 0) * 100) })),
    });
    if (!minimumCheck.valid) {
      setError({ code: minimumCheck.code as SHCErrorCode, message: t('checkout.minimum_order') });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await checkoutWithCredits(allergenAck, selectedSlot, creditsToApply, isCorporate);
      const orderId = (res as { order?: { id?: string } }).order?.id || '';
      setCompletedOrderId(orderId);
      if (isCorporate && orderId) {
        await flagCorporateOrder(orderId, checkoutCopy.corporateFlagNote);
      }
    } catch (e: any) {
      const message =
        e?.message === 'Failed to fetch' ? checkoutCopy.errorNetwork : e?.message || checkoutCopy.errorPlaceOrder;
      setError({ code: e.code, message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToOrder = useCallback(() => {
    if (!completedOrderId) return;
    router.push(`/(customer)/orders/${completedOrderId}` as any);
  }, [completedOrderId, router]);

  const confirmPay = async (ref: string) => {
    if (!completedOrderId) return;
    try {
      await transitionOrder(completedOrderId, 'paid');
      console.log('[PayNow] ref captured:', ref, 'for', completedOrderId);
    } catch (e) { /* non fatal */ }
    const celebrated = await firstOrderMilestone.triggerIfFirst();
    if (!celebrated) navigateToOrder();
  };

  if (!cart.items?.length) {
    return (
      <View style={styles.empty}>
        <GourmeatScreenHeader
          title={t('checkout.title')}
          subtitle={t('checkout.empty_subtitle')}
          onBack={() => router.back()}
        />
        <GourmeatPrimaryButton
          label={t('orders.browse_cta')}
          onPress={() => router.replace('/(customer)' as any)}
          testID="checkout-empty-browse"
        />
      </View>
    );
  }

  const creditDiscount = Math.floor(creditsToApply / 4);
  const cartItems = (cart.items || []).map((i: any) => ({
    name: String(i.name || 'Dish'),
    qty: Number(i.qty || 1),
    price: Number(i.price || 0),
  }));

  const orderSummaryCard = (
    <SHCFadeIn>
      <View style={{ marginBottom: shcSpacing.md }}>
        <GourmeatOrderSummaryCard
          items={cartItems}
          subtotal={total}
          discount={creditDiscount > 0 ? creditDiscount : undefined}
          total={amountDue}
        />
      </View>
    </SHCFadeIn>
  );

  if (completedOrderId) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 120 }]}
          testID="checkout-screen"
        >
          <SHCCartPageHero
            title={t('checkout.order_placed')}
            subtitle={checkoutCopy.orderPlacedSubtitle(completedOrderId)}
            imageUri={BENTO_ACTION_IMAGES.checkout}
          />
          {orderSummaryCard}
          <PayNowPanel orderId={completedOrderId} total={amountDue} onConfirmPay={confirmPay} />
          <Text style={styles.paynowHint}>{t('checkout.paynow_hint')}</Text>
          <SHCCard variant="bento-yellow" style={styles.footerCard}>
            <Text style={styles.footerText}>
              {checkoutCopy.footerEarnings(Math.floor(amountDue * 0.85))}
            </Text>
          </SHCCard>
        </ScrollView>
        <SHCCelebration
          visible={firstOrderMilestone.show}
          message={checkoutCopy.firstOrderCelebration}
          onDone={() => {
            firstOrderMilestone.dismiss();
            navigateToOrder();
          }}
          testID="first-order-celebration"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 120 }]}
        testID="checkout-screen"
      >
        <Text style={styles.checkoutTitle}>{t('checkout.title')}</Text>
        <Text style={styles.checkoutSubtitle}>
          {t('checkout.portions_hdb').replace('{count}', String(itemCount))}
        </Text>

        <SHCCard variant="bento-mint" style={styles.sectionCard}>
          <SHCSectionTitle style={styles.sectionTitle}>{t('checkout.collection_point')}</SHCSectionTitle>
          {collectionLocation ? (
            <Text style={styles.locationBody}>{formatLocationLabel(collectionLocation)}</Text>
          ) : (
            <Text style={styles.locationBody}>{t('checkout.no_location')}</Text>
          )}
          <SHCButton variant="outline" size="sm" appearance="customer" onPress={() => router.push('/(customer)/location' as any)} testID="checkout-change-location">
            <SHCButtonText variant="outline">{t('checkout.change_location')}</SHCButtonText>
          </SHCButton>
        </SHCCard>

        {orderSummaryCard}

        <Text style={styles.sectionLabel}>{t('checkout.payment_method')}</Text>
        <GourmeatPaymentMethodRow
          id="paynow"
          label={t('checkout.paynow_label')}
          subtitle={t('checkout.paynow_method_sub')}
          selected={paymentMethod === 'paynow'}
          onSelect={handlePaymentSelect}
          testID="payment-paynow"
        />
        {creditBal > 0 && (
          <GourmeatPaymentMethodRow
            id="credits"
            label={t('checkout.credits_method').replace('{balance}', String(creditBal))}
            subtitle={t('checkout.credits_method_sub')}
            selected={paymentMethod === 'credits'}
            onSelect={handlePaymentSelect}
            testID="payment-credits"
          />
        )}

        <SHCFadeIn>
          <SHCCard style={styles.sectionCard}>
            <SHCSectionTitle style={styles.sectionTitle}>{t('checkout.collection_section_mobile')}</SHCSectionTitle>
            <CollectionSlotPicker availableSlots={slots} onSelect={handleSlot} selected={selectedSlot || undefined} />
          </SHCCard>

          <SHCCard style={styles.sectionCard}>
            <SHCSectionTitle style={styles.sectionTitle}>{t('checkout.allergen_section_mobile')}</SHCSectionTitle>
            <AllergenAckCheckbox
              checked={allergenAck}
              onChange={setAllergenAck}
              allergens={(cart.items[0] as any)?.allergens}
              tier1={[checkoutCopy.tier1Typical]}
            />
          </SHCCard>

          <SHCCard style={styles.sectionCard}>
            <SHCSectionTitle style={styles.sectionTitle}>{t('checkout.pdpa_section_mobile')}</SHCSectionTitle>
            <Pressable
              onPress={() => setPdpaConsent(!pdpaConsent)}
              testID="pdpa-consent"
              style={[styles.pdpaRow, pdpaConsent && styles.pdpaRowChecked]}
            >
              <View style={[styles.pdpaBox, pdpaConsent && styles.pdpaBoxChecked]}>
                {pdpaConsent && <Text style={styles.pdpaCheck}>✓</Text>}
              </View>
              <Text style={styles.pdpaText}>{t('checkout.pdpa_consent_mobile')}</Text>
            </Pressable>
            <Text style={styles.pdpaHint}>{t('checkout.pdpa_hint')}</Text>
          </SHCCard>

          {creditBal > 0 && (
            <SHCCard variant="bento-mint" style={styles.sectionCard} testID="credits-apply-section">
              <CreditBadge balance={creditBal} tier={creditsData?.tier as 'Bronze' | 'Silver' | 'Gold' | undefined} />
              <Text style={styles.creditsHint}>
                {checkoutCopy.creditsAvailableHint(creditBal)}
              </Text>
              <View style={styles.creditPresets}>
                {[0, 20, 40, Math.min(80, creditBal)].map((v, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setCreditsToApply(v)}
                    style={[styles.creditChip, creditsToApply === v && styles.creditChipActive]}
                    testID={`credit-preset-${v}`}
                  >
                    <Text style={[styles.creditChipText, creditsToApply === v && styles.creditChipTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </SHCCard>
          )}

          <Pressable
            onPress={() => setIsCorporate(!isCorporate)}
            style={styles.corporateRow}
            testID="corporate-flag-toggle"
            accessibilityLabel={checkoutCopy.corporateA11y}
          >
            <View style={[styles.corporateBox, isCorporate && styles.corporateBoxChecked]} />
            <Text style={styles.corporateText}>{t('checkout.corporate_mobile')}</Text>
          </Pressable>

          {error && <SHCErrorBanner code={error.code} message={error.message} />}

          <SHCCard variant="bento-yellow" style={styles.footerCard}>
            <Text style={styles.footerText}>
              {checkoutCopy.footerEarnings(Math.floor(amountDue * 0.85))}
            </Text>
          </SHCCard>
        </SHCFadeIn>
      </ScrollView>

      <View style={{ paddingHorizontal: shcSpacing.md, paddingBottom: Math.max(insets.bottom, shcSpacing.md) }}>
        <GourmeatPayButton
          label={isSubmitting ? t('checkout.placing') : t('checkout.place_order')}
          amount={`S$${amountDue.toFixed(2)}`}
          onPress={handleCheckout as any}
          disabled={isSubmitting}
          loading={isSubmitting}
          testID="do-checkout"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  empty: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  checkoutTitle: { fontSize: 24, fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 },
  checkoutSubtitle: { fontSize: 13, color: gourmeatColors.textLight, marginBottom: shcSpacing.md },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm },
  sectionCard: { marginBottom: shcSpacing.md },
  sectionTitle: { marginTop: 0 },
  locationBody: { fontSize: 13, color: gourmeatColors.text, marginBottom: shcSpacing.sm, lineHeight: 18 },
  pdpaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: shcSpacing.sm,
    borderRadius: gourmeatRadii.md,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  pdpaRowChecked: { backgroundColor: gourmeatColors.primaryLight },
  pdpaBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    marginRight: shcSpacing.sm,
    borderRadius: gourmeatRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gourmeatColors.surface,
  },
  pdpaBoxChecked: { backgroundColor: gourmeatColors.primary },
  pdpaCheck: { color: gourmeatColors.onPrimary, fontWeight: '800' },
  pdpaText: { flex: 1, fontSize: 13, color: gourmeatColors.text },
  pdpaHint: { fontSize: 10, color: gourmeatColors.textLight, marginTop: 6 },
  creditsHint: { fontSize: 12, marginTop: shcSpacing.sm },
  creditPresets: { flexDirection: 'row', gap: shcSpacing.sm, marginTop: shcSpacing.sm, flexWrap: 'wrap' },
  creditChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: gourmeatRadii.sm,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  creditChipActive: { backgroundColor: gourmeatColors.primary },
  creditChipText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  creditChipTextActive: { color: gourmeatColors.onPrimary },
  creditsApplied: { color: gourmeatColors.success, fontSize: 12, marginTop: 6, fontWeight: '600' },
  corporateRow: { flexDirection: 'row', alignItems: 'center', padding: shcSpacing.sm, marginBottom: shcSpacing.md },
  corporateBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    marginRight: shcSpacing.sm,
    backgroundColor: gourmeatColors.surface,
    borderRadius: gourmeatRadii.sm,
  },
  corporateBoxChecked: { backgroundColor: gourmeatColors.primary },
  corporateText: { fontSize: 12, fontWeight: '600' },
  paynowHint: { marginTop: shcSpacing.sm, fontSize: 12, color: gourmeatColors.success, fontWeight: '600' },
  footerCard: { marginTop: shcSpacing.md },
  footerText: { fontSize: 11, color: gourmeatColors.textLight, lineHeight: 16 },
});