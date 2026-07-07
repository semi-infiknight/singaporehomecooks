'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BENTO_ACTION_IMAGES, getFirstCartProductId } from '@shc/utils';
import { useCart, useCredits } from '../../lib/useProducts';
import { useCheckout, useTransitionOrder } from '../../lib/useOrder';
import { useCollectionSlots } from '../../lib/useProducts';
import {
  SHCCard,
  SHCButton,
  SHCErrorBanner,
  AllergenAckCheckbox,
  CollectionSlotPicker,
  PayNowPanel,
  WalletCard,
  SHCSectionTitle,
  GourmeatScreenHeader,
  GourmeatPrimaryButton,
  BottomStickyBar,
  CheckoutStepper,
  useSHCTrayWeb,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
} from '../components/SHCWebComponents';
import { useAuth } from '../../lib/useAuth';
import { enforceMinimumOrder } from '@shc/business-rules';
import { useShcI18n, getCheckoutScreenCopy } from '@shc/i18n';
import { WebPushPromptBanner } from '../components/WebPushOptIn';

export default function CheckoutPage() {
  const router = useRouter();
  const { t, locale } = useShcI18n();
  const checkoutCopy = getCheckoutScreenCopy(locale);
  const { user, loading: authLoading } = useAuth();
  const { data: cart = { items: [] }, isLoading: cartLoading, isFetching: cartFetching } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/checkout');
    }
  }, [authLoading, user, router]);
  const checkoutMut = useCheckout();
  const transitionMut = useTransitionOrder();
  const { data: creditsData } = useCredits();

  const [allergenAck, setAllergenAck] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [selected, setSelected] = useState<{ date: string; slot: string } | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paynowRef, setPaynowRef] = useState('');
  const [creditsApply, setCreditsApply] = useState(0);
  const [isCorp, setIsCorp] = useState(false);
  const { openTray, dismiss } = useSHCTrayWeb();
  const {
    show: showFirstOrderCelebration,
    triggerIfFirst: triggerFirstOrder,
    dismiss: dismissFirstOrderCelebration,
  } = useMilestoneCelebrationWeb('first_order', user?.id || user?.name || 'anon');

  const firstPid = getFirstCartProductId(cart.items || []);
  const { data: slots = [] } = useCollectionSlots(firstPid || 'dish_nasi_lemak_prawn_001');
  const total = (cart.items || []).reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);
  const creditBal = creditsData?.balance || 0;
  const amountDue = Math.max(0, total - Math.floor(creditsApply / 4));

  const openAllergenTray = useCallback(() => {
    openTray(
      { id: 'allergen-gate', title: t('checkout.allergen_section'), height: 'medium' },
      <AllergenGateTrayContentWeb
        onConfirm={() => {
          setAllergenAck(true);
          dismiss();
        }}
      />
    );
  }, [dismiss, openTray, t]);

  const doCheckout = async () => {
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
    if (!selected) {
      setError({ code: 'SHC-AVAIL-001', message: checkoutCopy.errorSlotRequired });
      return;
    }
    const totalCents = Math.round(total * 100);
    const minimumCheck = enforceMinimumOrder({
      totalCents,
      lines: (cart.items || []).map((i: { price: number }) => ({ price_cents: Math.round(i.price * 100) })),
    });
    if (!minimumCheck.valid) {
      setError({ code: minimumCheck.code, message: t('checkout.minimum_order') });
      return;
    }
    try {
      const res: { order?: { id: string }; id?: string } = await checkoutMut.mutateAsync({
        allergenAck,
        collection: selected,
        pdpaConsent,
        creditsToApply: creditsApply,
        isCorporate: isCorp,
      });
      const oid = res?.order?.id || res?.id || 'SHC-' + Date.now();
      setOrderId(oid);
      if (isCorp && oid) {
        try {
          const { flagCorporateOrder } = await import('../../lib/api-client');
          await flagCorporateOrder(oid, checkoutCopy.corporateFlagNote);
        } catch {
          /* non-fatal */
        }
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const message =
        err?.message === 'Failed to fetch'
          ? checkoutCopy.errorNetwork
          : err?.message || checkoutCopy.errorPlaceOrder;
      setError({ code: err?.code, message });
    }
  };

  const confirmPay = async (ref: string) => {
    if (!orderId) return;
    try {
      await transitionMut.mutateAsync({ orderId, to: 'paid' as never });
      console.log('[PayNow] ref captured:', ref, 'for', orderId);
    } catch {
      /* non-fatal — ops can reconcile manually */
    }
    const celebrated = await triggerFirstOrder();
    if (!celebrated) router.push(`/orders/${orderId}`);
  };

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <GourmeatScreenHeader
          title={t('checkout.order_placed')}
          subtitle={checkoutCopy.orderPlacedSubtitle(orderId)}
          backHref={`/orders/${orderId}`}
          backLabel={t('orders.detail.back')}
        />
        <div className="relative h-24 overflow-hidden rounded-xl border border-border shadow-[var(--shc-shadow-soft)] mb-4">
          <Image src={BENTO_ACTION_IMAGES.checkout} alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <PayNowPanel
          amount={amountDue}
          reference={paynowRef || orderId}
          onRefChange={setPaynowRef}
          onConfirmPay={confirmPay}
        />
        <p className="mt-3 text-xs font-medium text-muted-foreground">{t('checkout.paynow_hint')}</p>
        <WebPushPromptBanner className="mt-4" />
        <SHCCelebrationWeb
          visible={showFirstOrderCelebration}
          message={checkoutCopy.firstOrderCelebration}
          onDone={() => {
            dismissFirstOrderCelebration();
            router.push(`/orders/${orderId}`);
          }}
          testID="first-order-celebration"
        />
      </div>
    );
  }

  if (authLoading || cartLoading || cartFetching) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-muted-foreground font-semibold">{t('checkout.loading')}</p>
      </div>
    );
  }

  const items = cart.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 shc-bottom-bar-pad">
        <GourmeatScreenHeader
          title={t('checkout.title')}
          subtitle={t('checkout.empty_subtitle')}
          backHref="/cart"
          backLabel={t('checkout.back_cart_label')}
        />
        <GourmeatPrimaryButton
          label={t('orders.browse_cta')}
          onClick={() => router.push('/')}
          className="mt-4"
          testID="checkout-empty-browse"
        />
      </div>
    );
  }

  const checkoutSteps = [
    { id: 'slot', label: t('checkout.step.collection'), done: !!selected },
    { id: 'safety', label: t('checkout.step.safety'), done: allergenAck && pdpaConsent },
    { id: 'pay', label: t('checkout.step.pay'), done: false },
  ];
  const checkoutStep = !selected ? 1 : !allergenAck || !pdpaConsent ? 2 : 3;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 shc-bottom-bar-pad">
      <Link
        href="/cart"
        className="text-sm font-bold text-primary mb-4 inline-block"
      >
        {t('checkout.back_cart')}
      </Link>
      <div className="relative h-24 overflow-hidden rounded-xl border border-border shadow-[var(--shc-shadow-soft)] mb-4">
        <Image src={BENTO_ACTION_IMAGES.checkout} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[rgba(36,24,18,0.45)] flex flex-col justify-end p-4">
          <h1 className="text-xl font-black text-white">{t('checkout.title')}</h1>
          <p className="text-xs font-semibold text-white/90">
            {t('checkout.portions_hdb').replace(
              '{count}',
              String(items.reduce((s: number, i: { qty: number }) => s + i.qty, 0))
            )}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">{t('checkout.steps_hint')}</p>

      <CheckoutStepper steps={checkoutSteps} currentStep={checkoutStep} />

      <SHCCard className="mb-6 shc-bento-peach" variant="customer">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-semibold">{checkoutCopy.itemsCount(items.length)}</span>
          <span className="text-2xl font-black tabular-nums font-mono">S${total.toFixed(2)}</span>
        </div>
      </SHCCard>

      <SHCSectionTitle subtitle={t('checkout.collection_subtitle')}>{t('checkout.collection_slot')}</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={selected} onSelect={(d, s) => setSelected({ date: d, slot: s })} />

      <SHCSectionTitle subtitle={t('checkout.safety_subtitle')}>{t('checkout.safety_title')}</SHCSectionTitle>
      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-checkout-web" />
      <label className="mt-3 flex gap-3 text-sm p-4 bg-card border border-border rounded-lg cursor-pointer shadow-[var(--shc-shadow-soft)]">
        <input
          type="checkbox"
          checked={pdpaConsent}
          onChange={(e) => setPdpaConsent(e.target.checked)}
          data-testid="pdpa-consent-web"
          className="mt-0.5 w-4 h-4 accent-primary rounded"
        />
        <span className="font-medium">{t('checkout.pdpa_consent')}</span>
      </label>

      <SHCSectionTitle subtitle={t('checkout.credits_subtitle')}>{t('checkout.credits_title')}</SHCSectionTitle>
      <WalletCard balance={creditBal} tier={creditsData?.tier} />
      <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
        <label className="flex items-center gap-2 font-semibold">
          <span className="text-muted-foreground">{t('checkout.apply_credits')}</span>
          <input
            type="number"
            min={0}
            max={creditBal}
            value={creditsApply}
            onChange={(e) => setCreditsApply(Math.min(creditBal, parseInt(e.target.value) || 0))}
            className="shc-input w-20 py-1.5"
          />
          <span className="text-muted-foreground">
            {t('checkout.credits_off').replace('{amount}', (creditsApply / 4).toFixed(0))}
          </span>
        </label>
        <button
          type="button"
          onClick={() => setIsCorp(!isCorp)}
          className={`text-xs px-3 py-1.5 border border-border rounded-lg font-bold transition-colors shadow-[var(--shc-shadow-soft)] ${
            isCorp ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
          }`}
        >
          {t('checkout.corporate')}
        </button>
      </div>

      {error && <SHCErrorBanner code={error.code} message={error.message} />}

      <SHCSectionTitle>{t('checkout.payment')}</SHCSectionTitle>
      <PayNowPanel amount={amountDue} reference={'WEB-' + Date.now().toString().slice(-6)} onRefChange={setPaynowRef} />

      {/* Desktop CTA */}
      <SHCButton
        appearance="customer"
        className="mt-6 w-full hidden sm:flex"
        size="lg"
        onClick={doCheckout}
        disabled={checkoutMut.isPending}
        testID="complete-checkout-web"
      >
        {checkoutMut.isPending ? t('checkout.placing') : `${t('checkout.place_order')} · S$${amountDue.toFixed(2)}`}
      </SHCButton>

      {/* Mobile bottom sticky CTA */}
      <BottomStickyBar className="sm:hidden" appearance="customer">
        <div className="flex gap-3 items-center">
          <div className="shrink-0">
            <div className="text-xs font-bold text-muted-foreground">{t('checkout.due')}</div>
            <div className="text-lg font-black font-mono tabular-nums">S${amountDue.toFixed(2)}</div>
          </div>
          <SHCButton
            appearance="customer"
            className="flex-1"
            size="lg"
            onClick={doCheckout}
            disabled={checkoutMut.isPending}
            testID="complete-checkout-web"
          >
            {checkoutMut.isPending ? t('checkout.placing_short') : t('checkout.place_order')}
          </SHCButton>
        </div>
      </BottomStickyBar>
    </div>
  );
}

function AllergenGateTrayContentWeb({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useShcI18n();
  const [localAck, setLocalAck] = useState(false);

  return (
    <div className="space-y-4" data-testid="allergen-gate-tray-web">
      <p className="text-sm font-medium text-muted-foreground leading-relaxed">{t('checkout.allergen_gate_body')}</p>
      <AllergenAckCheckbox checked={localAck} onChange={setLocalAck} testID="allergen-tray-ack-web" />
      <SHCButton
        appearance="customer"
        className="w-full"
        size="lg"
        disabled={!localAck}
        onClick={onConfirm}
        testID="allergen-tray-confirm-web"
      >
        {t('checkout.allergen_confirm')}
      </SHCButton>
    </div>
  );
}