'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BENTO_ACTION_IMAGES, getFirstCartProductId } from '@shc/utils';
import { useCart, useCredits } from '../../lib/useProducts';
import { useCheckout } from '../../lib/useOrder';
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
  SHCPageHeader,
  BottomStickyBar,
  CheckoutStepper,
} from '../components/SHCWebComponents';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart = { items: [] } } = useCart();
  const checkoutMut = useCheckout();
  const { data: creditsData } = useCredits();

  const [allergenAck, setAllergenAck] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [selected, setSelected] = useState<{ date: string; slot: string } | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paynowRef, setPaynowRef] = useState('');
  const [creditsApply, setCreditsApply] = useState(0);
  const [isCorp, setIsCorp] = useState(false);

  const firstPid = getFirstCartProductId(cart.items || []);
  const { data: slots = [] } = useCollectionSlots(firstPid || 'dish_nasi_lemak_prawn_001');
  const total = (cart.items || []).reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);
  const creditBal = creditsData?.balance || 0;
  const amountDue = Math.max(0, total - Math.floor(creditsApply / 4));

  const doCheckout = async () => {
    setError(null);
    if (!allergenAck) {
      setError({ code: 'SHC-CART-003', message: 'Please acknowledge allergens before placing your order.' });
      return;
    }
    if (!pdpaConsent) {
      setError({ code: 'SHC-GENERIC-001', message: 'Please consent to data processing to continue.' });
      return;
    }
    if (!selected) {
      setError({ code: 'SHC-AVAIL-001', message: 'Please select a collection slot.' });
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
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({ code: err?.code, message: err?.message || 'Unable to place order. Please try again.' });
    }
  };

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="relative h-24 overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] mb-4">
          <Image src={BENTO_ACTION_IMAGES.checkout} alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-[rgba(36,24,18,0.45)] flex flex-col justify-end p-4">
            <h1 className="text-xl font-black text-white">Order placed</h1>
            <p className="text-xs font-semibold text-white/90">Ref {orderId} — complete PayNow to confirm</p>
          </div>
        </div>
        <PayNowPanel amount={amountDue} reference={paynowRef || orderId} onRefChange={setPaynowRef} />
        <SHCButton className="mt-6 w-full" size="lg" onClick={() => router.push(`/orders/${orderId}`)}>
          Track your order
        </SHCButton>
      </div>
    );
  }

  const items = cart.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <SHCPageHeader title="Checkout" subtitle="Your cart is empty." backHref="/cart" backLabel="Back to cart" />
      </div>
    );
  }

  const canPlace = selected && allergenAck && pdpaConsent && !checkoutMut.isPending;
  const checkoutSteps = [
    { id: 'slot', label: 'Collection', done: !!selected },
    { id: 'safety', label: 'Safety', done: allergenAck && pdpaConsent },
    { id: 'pay', label: 'PayNow', done: false },
  ];
  const checkoutStep = !selected ? 1 : !allergenAck || !pdpaConsent ? 2 : 3;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 shc-bottom-bar-pad">
      <div className="relative h-24 overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] mb-4">
        <Image src={BENTO_ACTION_IMAGES.checkout} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[rgba(36,24,18,0.45)] flex flex-col justify-end p-4">
          <h1 className="text-xl font-black text-white">Checkout</h1>
          <p className="text-xs font-semibold text-white/90">
            {items.length} item{items.length !== 1 ? 's' : ''} · PayNow collection
          </p>
        </div>
      </div>
      <a
        href="/cart"
        className="text-sm font-semibold text-muted-foreground hover:text-primary mb-4 inline-block"
      >
        ← Back to cart
      </a>
      <p className="text-muted-foreground mb-4 text-sm">
        3 quick steps — collection, safety, then PayNow.
      </p>

      <CheckoutStepper steps={checkoutSteps} currentStep={checkoutStep} />

      <SHCCard className="mb-6 shc-bento-peach">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-semibold">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <span className="text-2xl font-black tabular-nums font-mono">S${total.toFixed(2)}</span>
        </div>
      </SHCCard>

      <SHCSectionTitle subtitle="Choose when you'll collect from the cook's home">Collection slot</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={selected} onSelect={(d, s) => setSelected({ date: d, slot: s })} />

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

      <SHCSectionTitle subtitle="Earn 5% back on every collected order">Home Credits</SHCSectionTitle>
      <WalletCard balance={creditBal} tier={creditsData?.tier} />
      <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
        <label className="flex items-center gap-2 font-semibold">
          <span className="text-muted-foreground">Apply</span>
          <input
            type="number"
            min={0}
            max={creditBal}
            value={creditsApply}
            onChange={(e) => setCreditsApply(Math.min(creditBal, parseInt(e.target.value) || 0))}
            className="shc-input w-20 py-1.5"
          />
          <span className="text-muted-foreground">credits (~S${(creditsApply / 4).toFixed(0)} off)</span>
        </label>
        <button
          type="button"
          onClick={() => setIsCorp(!isCorp)}
          className={`text-xs px-3 py-1.5 border-2 border-[var(--shc-border-brutal)] rounded-lg font-bold transition-colors shadow-[var(--shc-shadow-brutal-sm)] ${
            isCorp ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'
          }`}
        >
          Corporate invoice
        </button>
      </div>

      {error && <SHCErrorBanner code={error.code} message={error.message} />}

      <SHCSectionTitle>Payment</SHCSectionTitle>
      <PayNowPanel amount={amountDue} reference={'WEB-' + Date.now().toString().slice(-6)} onRefChange={setPaynowRef} />

      {/* Desktop CTA */}
      <SHCButton
        className="mt-6 w-full hidden sm:flex"
        size="lg"
        onClick={doCheckout}
        disabled={!canPlace}
        testID="complete-checkout-web"
      >
        {checkoutMut.isPending ? 'Placing order…' : `Place order · S$${amountDue.toFixed(2)}`}
      </SHCButton>

      {/* Mobile bottom sticky CTA */}
      <BottomStickyBar className="sm:hidden">
        <div className="flex gap-3 items-center">
          <div className="shrink-0">
            <div className="text-xs font-bold text-muted-foreground">Due</div>
            <div className="text-lg font-black font-mono tabular-nums">S${amountDue.toFixed(2)}</div>
          </div>
          <SHCButton
            className="flex-1"
            size="lg"
            onClick={doCheckout}
            disabled={!canPlace}
            testID="complete-checkout-web"
          >
            {checkoutMut.isPending ? 'Placing…' : 'Place order'}
          </SHCButton>
        </div>
      </BottomStickyBar>
    </div>
  );
}