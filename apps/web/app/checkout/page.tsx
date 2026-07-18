'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BENTO_ACTION_IMAGES,
  getFirstCartProductId,
  orderSuccessfulCopy,
  computeOneTimeOrderSummary,
} from '@shc/utils';
import { useCart } from '../../lib/useProducts';
import { useCheckout } from '../../lib/useOrder';
import { useCollectionSlots } from '../../lib/useProducts';
import {
  SHCCard,
  SHCButton,
  SHCErrorBanner,
  AllergenAckCheckbox,
  CollectionSlotPicker,
  PayNowPanel,
  SHCSectionTitle,
  SHCPageHeader,
  BottomStickyBar,
  CheckoutStepper,
  useSHCTrayWeb,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
  SHCSkeletonList,
} from '../components/SHCWebComponents';
import { useAuth } from '../../lib/useAuth';
import { createOrderPayNow, getOrder } from '../../lib/api-client';
import { clearCartCheckoutNotes, readCartCheckoutNotes, toOrderNotesPayload } from '../../lib/cart-notes';

function extractOrderId(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  if (typeof r.id === 'string' && r.id) return r.id;
  const order = r.order as Record<string, unknown> | undefined;
  if (order && typeof order.id === 'string' && order.id) return order.id;
  const data = r.data as Record<string, unknown> | undefined;
  if (data) {
    if (typeof data.id === 'string' && data.id) return data.id;
    const nested = data.order as Record<string, unknown> | undefined;
    if (nested && typeof nested.id === 'string') return nested.id;
  }
  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/checkout');
    }
  }, [authLoading, user, router]);

  const checkoutMut = useCheckout();

  const [allergenAck, setAllergenAck] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [selected, setSelected] = useState<{ date: string; slot: string } | null>(null);

  // Cooking soon cart: lock collection to batch date/slot (server also enforces on complete)
  const dropCart = Boolean(
    (cart as any)?.drop_id ||
      ((cart?.items as any[]) || [])?.some((i: any) => i.drop_id)
  );
  const dropCollection = (() => {
    const c = cart as any;
    if (c?.collection_date && c?.collection_slot) {
      return { date: String(c.collection_date), slot: String(c.collection_slot) };
    }
    const line = ((cart?.items as any[]) || [])?.find((i: any) => i.drop_id);
    if (line?.collection_date && line?.collection_slot) {
      return { date: String(line.collection_date), slot: String(line.collection_slot) };
    }
    return null;
  })();

  useEffect(() => {
    if (dropCart && dropCollection) {
      setSelected(dropCollection);
    }
  }, [dropCart, dropCollection?.date, dropCollection?.slot]);

  const effectiveSlot = selected ?? (dropCart && dropCollection ? dropCollection : null);
  const checkoutReady = Boolean(effectiveSlot && allergenAck && pdpaConsent);
  const checkoutHint = !effectiveSlot
    ? 'Select a collection date and time to continue'
    : !allergenAck
      ? 'Acknowledge allergens to continue'
      : !pdpaConsent
        ? 'Confirm PDPA consent to continue'
        : null;

  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paynowRef, setPaynowRef] = useState('');
  const [payPhase, setPayPhase] = useState<'form' | 'paynow' | 'done'>('form');
  const [paySession, setPaySession] = useState<
    (Awaited<ReturnType<typeof createOrderPayNow>> & { error?: string }) | null
  >(null);
  const [paySessionLoading, setPaySessionLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const paySessionOrderRef = useRef<string | null>(null);
  const { openTray, dismiss } = useSHCTrayWeb();

  const loadPayNowSession = useCallback(async (oid: string, force = false) => {
    if (!force && paySessionOrderRef.current === oid) return;
    paySessionOrderRef.current = oid;
    setPaySessionLoading(true);
    try {
      const s = await createOrderPayNow(oid);
      setPaySession(s);
      if (s.reference) setPaynowRef(s.reference);
      if (s.provider === 'hitpay') setWaitingForPayment(true);
      if (s.provider === 'already_paid') {
        setPayPhase('done');
        setWaitingForPayment(false);
      }
    } catch (e: any) {
      paySessionOrderRef.current = null;
      setPaySession({
        provider: 'hitpay_error',
        order_id: oid,
        error: e?.message || 'Could not create PayNow QR',
      } as any);
    } finally {
      setPaySessionLoading(false);
    }
  }, []);

  const {
    show: showFirstOrderCelebration,
    triggerIfFirst: triggerFirstOrder,
    dismiss: dismissFirstOrderCelebration,
  } = useMilestoneCelebrationWeb('first_order', user?.id || user?.name || 'anon');

  useEffect(() => {
    if (orderId && payPhase === 'paynow') void loadPayNowSession(orderId);
  }, [orderId, payPhase, loadPayNowSession]);

  // Poll until HitPay webhook marks paid
  useEffect(() => {
    if (!orderId || payPhase !== 'paynow' || !waitingForPayment) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const o = await getOrder(orderId);
        const st = String((o as any)?.shc_status || '');
        if (['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'].includes(st)) {
          if (cancelled) return;
          setWaitingForPayment(false);
          setPayPhase('done');
          try {
            await triggerFirstOrder();
          } catch {
            /* ignore */
          }
          window.setTimeout(() => router.push(`/orders/${orderId}`), 900);
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, payPhase, waitingForPayment, router, triggerFirstOrder]);

  const firstPid = getFirstCartProductId(cart?.items || []);
  const { data: slots = [] } = useCollectionSlots(firstPid || 'dish_nasi_lemak_prawn_001');
  const oneTime = computeOneTimeOrderSummary(cart?.items || []);
  const amountDue = oneTime.total;

  const openAllergenTray = useCallback(() => {
    openTray(
      { id: 'allergen-gate', title: 'Allergen acknowledgment', height: 'medium' },
      <AllergenGateTrayContentWeb
        onConfirm={() => {
          setAllergenAck(true);
          dismiss();
        }}
      />
    );
  }, [dismiss, openTray]);

  const showCheckoutError = (err: { code?: string; message: string }) => {
    setError(err);
    // Sticky bar can cover the banner on mobile — scroll it into view
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  };

  /** Place order then show PayNow confirm (or auto-confirm in demo). */
  const doCheckout = async () => {
    setError(null);
    if (!allergenAck) {
      openAllergenTray();
      showCheckoutError({ code: 'SHC-CART-003', message: 'Please acknowledge allergens before placing your order.' });
      return;
    }
    if (!pdpaConsent) {
      showCheckoutError({ code: 'SHC-GENERIC-001', message: 'Please consent to data processing to continue.' });
      return;
    }
    if (!effectiveSlot) {
      showCheckoutError({ code: 'SHC-AVAIL-001', message: 'Please select a collection slot.' });
      return;
    }
    try {
      const cartNotes = readCartCheckoutNotes();
      const res = await checkoutMut.mutateAsync({
        allergenAck,
        collection: effectiveSlot,
        pdpaConsent,
        notes: toOrderNotesPayload(cartNotes),
      });
      clearCartCheckoutNotes();
      const oid = extractOrderId(res);
      if (!oid) {
        showCheckoutError({
          code: 'SHC-GENERIC-001',
          message: 'Order was created but no order id returned. Check My orders, or try again.',
        });
        return;
      }
      setOrderId(oid);
      setPaynowRef(oid);
      setPayPhase('paynow');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const message =
        err?.message === 'Failed to fetch'
          ? 'Could not reach the server. Check your connection and try again.'
          : err?.message || 'Unable to place order. Please try again.';
      showCheckoutError({ code: err?.code, message });
    }
  };

  // ── Success / processing ──
  if (orderId && payPhase === 'done') {
    const okCopy = orderSuccessfulCopy();
    return (
      <div
        className="max-w-xl mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center text-center"
        data-testid="order-success-screen"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl text-green-700 mb-4">
          ✓
        </div>
        <h1 className="text-2xl font-black mb-2">{okCopy.title}</h1>
        <p className="text-sm font-semibold text-muted-foreground mb-2">{okCopy.subtitle}</p>
        <p className="text-xs text-muted-foreground mb-6">Ref {orderId}</p>
        <SHCButton onClick={() => router.push(`/orders/${orderId}`)} testID="order-success-track">
          Track order
        </SHCButton>
        <SHCCelebrationWeb
          visible={showFirstOrderCelebration}
          message="Your first order — thank you for supporting local home cooks!"
          onDone={() => {
            dismissFirstOrderCelebration();
            router.push(`/orders/${orderId}`);
          }}
          testID="first-order-celebration"
        />
      </div>
    );
  }

  // ── PayNow after order placed ──
  if (orderId && payPhase === 'paynow') {
    const okCopy = orderSuccessfulCopy();
    return (
      <div className="max-w-xl mx-auto px-4 py-8 shc-safe-bottom-pad" data-testid="order-paynow-screen">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl text-green-700 mx-auto mb-3">
            ✓
          </div>
          <h1 className="text-xl font-black">{okCopy.title}</h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            Complete PayNow to confirm · Ref {orderId}
          </p>
        </div>
        <PayNowPanel
          amount={amountDue}
          reference={paynowRef || orderId}
          session={paySession}
          loadingSession={paySessionLoading}
          onRetry={() => orderId && void loadPayNowSession(orderId, true)}
          waitingForPayment={waitingForPayment}
        />
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Scan to pay · we confirm via HitPay · cook can accept after paid.
        </p>
        <button
          type="button"
          className="mt-4 w-full text-sm font-bold text-primary"
          onClick={() => router.push(`/orders/${orderId}`)}
        >
          Skip to order tracking →
        </button>
      </div>
    );
  }

  if (authLoading || (cartLoading && !cart)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8" data-testid="checkout-skeleton">
        <SHCSkeletonList count={5} rowHeight={56} />
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <SHCPageHeader
          title="Checkout"
          subtitle="Your cart is empty. Add dishes from Discover, then return here."
          backHref="/cart"
          backLabel="Back to cart"
        />
        <SHCButton className="mt-4" onClick={() => router.push('/')}>
          Browse dishes
        </SHCButton>
      </div>
    );
  }

  const checkoutSteps = [
    { id: 'slot', label: 'Collection', done: !!effectiveSlot },
    { id: 'safety', label: 'Safety', done: allergenAck && pdpaConsent },
    { id: 'pay', label: 'PayNow', done: false },
  ];
  const checkoutStep = !effectiveSlot ? 1 : !allergenAck || !pdpaConsent ? 2 : 3;
  const placing = checkoutMut.isPending;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 shc-sticky-footer-pad md:shc-safe-bottom-pad" data-testid="checkout-form-screen">
      <div className="relative h-24 overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] mb-4">
        <Image src={BENTO_ACTION_IMAGES.checkout} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[rgba(36,24,18,0.45)] flex flex-col justify-end p-4">
          <h1 className="text-xl font-black text-white">Checkout</h1>
          <p className="text-xs font-semibold text-white/90">
            {items.length} item{items.length !== 1 ? 's' : ''} · PayNow · HDB collection
          </p>
        </div>
      </div>
      <a href="/cart" className="text-sm font-semibold text-muted-foreground hover:text-primary mb-4 inline-block">
        ← Back to cart
      </a>
      <p className="text-muted-foreground mb-4 text-sm">
        Collection slot → safety → Pay with PayNow.
      </p>

      <CheckoutStepper steps={checkoutSteps} currentStep={checkoutStep} />

      <SHCCard className="mb-6 shc-bento-peach">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-semibold">
            {items.length} item{items.length !== 1 ? 's' : ''} · incl. service fee
          </span>
          <span className="text-2xl font-black tabular-nums font-mono">S${amountDue.toFixed(2)}</span>
        </div>
      </SHCCard>

      <SHCSectionTitle
        subtitle={
          dropCart
            ? 'Fixed by the cook’s Cooking soon batch'
            : "Choose when you'll collect from the cook's home"
        }
      >
        Collection slot
      </SHCSectionTitle>
      {dropCart && dropCollection ? (
        <SHCCard className="mb-4 p-4" data-testid="checkout-drop-collection-locked">
          <p className="text-sm font-black">Cooking soon · collection locked</p>
          <p className="mt-1 text-sm font-semibold">
            {dropCollection.date} · {dropCollection.slot}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Capacity is reserved when you place the order (not when adding to cart).
          </p>
        </SHCCard>
      ) : null}
      {!dropCart && (
        <CollectionSlotPicker
          slots={slots}
          selected={selected}
          onSelect={(d, s) => setSelected({ date: d, slot: s })}
        />
      )}

      <SHCSectionTitle subtitle="Required before we can process your order">Safety & consent</SHCSectionTitle>
      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-checkout-web" />
      <label className="mt-3 flex gap-3 text-sm p-4 bg-card border-2 border-[var(--shc-border-brutal)] rounded-lg cursor-pointer shadow-[var(--shc-shadow-brutal-sm)]">
        <input
          type="checkbox"
          checked={pdpaConsent}
          onChange={(e) => setPdpaConsent(e.target.checked)}
          data-testid="pdpa-consent-web"
          className="mt-0.5 w-4 h-4 accent-primary rounded"
        />
        <span className="font-medium">
          I consent to Singapore Home Cooks processing my order and contact details in accordance with our privacy
          policy.
        </span>
      </label>


      {error && <SHCErrorBanner code={error.code} message={error.message} />}

      <SHCSectionTitle>Payment</SHCSectionTitle>
      <SHCCard className="mb-4 shc-bento-yellow" data-testid="paynow-summary-card">
        <p className="font-bold mb-1">Pay with PayNow</p>
        <p className="text-sm text-muted-foreground font-medium mb-2">
          Place the order to get your payment reference, then confirm transfer.
        </p>
        <p className="text-2xl font-black tabular-nums">S${amountDue.toFixed(2)}</p>
      </SHCCard>

      {/* Desktop CTA */}
      {checkoutHint && !placing ? (
        <p className="mt-2 text-xs font-bold text-muted-foreground text-center" data-testid="checkout-blocker-hint">
          {checkoutHint}
        </p>
      ) : null}
      <SHCButton
        className="mt-2 w-full hidden sm:flex"
        size="lg"
        onClick={doCheckout}
        disabled={!checkoutReady || placing}
        testID="complete-checkout-web"
      >
        {placing ? 'Placing order…' : effectiveSlot ? `Pay with PayNow · S$${amountDue.toFixed(2)}` : 'Select collection time'}
      </SHCButton>

      {/* Mobile sticky CTA — above tab bar */}
      <BottomStickyBar className="sm:hidden" offsetTabBar={false}>
        <div className="flex gap-3 items-center">
          <div className="shrink-0">
            <div className="text-xs font-bold text-muted-foreground">Due</div>
            <div className="text-lg font-black font-mono tabular-nums">S${amountDue.toFixed(2)}</div>
          </div>
          <SHCButton
            className="flex-1"
            size="lg"
            onClick={doCheckout}
            disabled={!checkoutReady || placing}
            testID="complete-checkout-web-mobile"
          >
            {placing ? 'Placing…' : effectiveSlot ? 'Pay with PayNow' : 'Select collection time'}
          </SHCButton>
        </div>
      </BottomStickyBar>
    </div>
  );
}

function AllergenGateTrayContentWeb({ onConfirm }: { onConfirm: () => void }) {
  const [localAck, setLocalAck] = useState(false);

  return (
    <div className="space-y-4" data-testid="allergen-gate-tray-web">
      <p className="text-sm font-medium text-muted-foreground leading-relaxed">
        Please review and acknowledge allergens before placing your order.
      </p>
      <AllergenAckCheckbox checked={localAck} onChange={setLocalAck} testID="allergen-tray-ack-web" />
      <SHCButton
        className="w-full"
        size="lg"
        disabled={!localAck}
        onClick={onConfirm}
        testID="allergen-tray-confirm-web"
      >
        I understand — continue
      </SHCButton>
    </div>
  );
}
