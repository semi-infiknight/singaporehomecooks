'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const firstPid = (cart.items || [])[0]?.productId;
  const { data: slots = [] } = useCollectionSlots(firstPid || '');
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
      // Corporate flag passed via checkoutWithCredits when enabled
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      setError({ code: err?.code, message: err?.message || 'Unable to place order. Please try again.' });
    }
  };

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <SHCPageHeader
          title="Order placed"
          subtitle={`Reference ${orderId} — complete your PayNow transfer to confirm.`}
        />
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
      <div className="max-w-xl mx-auto px-4 py-10">
        <SHCPageHeader title="Checkout" subtitle="Your cart is empty." backHref="/cart" backLabel="Back to cart" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <SHCPageHeader
        title="Checkout"
        subtitle="Review your order, pick a collection slot, and pay with PayNow."
        backHref="/cart"
        backLabel="Back to cart"
      />

      <SHCCard className="mb-6">
        <div className="flex justify-between">
          <span className="text-[#5C5144]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          <span className="text-xl font-semibold tabular-nums">S${total.toFixed(2)}</span>
        </div>
      </SHCCard>

      <SHCSectionTitle subtitle="Choose when you'll collect from the cook's home">Collection slot</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={selected} onSelect={(d, s) => setSelected({ date: d, slot: s })} />

      <SHCSectionTitle subtitle="Required before we can process your order">Safety & consent</SHCSectionTitle>
      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-checkout-web" />
      <label className="mt-3 flex gap-3 text-sm p-4 bg-white border border-[#E8D5B7] rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={pdpaConsent}
          onChange={(e) => setPdpaConsent(e.target.checked)}
          data-testid="pdpa-consent-web"
          className="mt-0.5 w-4 h-4 accent-[#1D9E75] rounded"
        />
        <span>
          I consent to Singapore Home Cooks processing my order and contact details in accordance with our privacy
          policy.
        </span>
      </label>

      <SHCSectionTitle subtitle="Earn 5% back on every collected order">Home Credits</SHCSectionTitle>
      <WalletCard balance={creditBal} tier={creditsData?.tier} />
      <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
        <label className="flex items-center gap-2">
          <span className="text-[#5C5144]">Apply</span>
          <input
            type="number"
            min={0}
            max={creditBal}
            value={creditsApply}
            onChange={(e) => setCreditsApply(Math.min(creditBal, parseInt(e.target.value) || 0))}
            className="shc-input w-20 py-1.5"
          />
          <span className="text-[#5C5144]">credits (~S${(creditsApply / 4).toFixed(0)} off)</span>
        </label>
        <button
          type="button"
          onClick={() => setIsCorp(!isCorp)}
          className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${
            isCorp ? 'bg-[#B85C38] text-white border-[#B85C38]' : 'border-[#E8D5B7] hover:bg-[#F5F0E6]'
          }`}
        >
          Corporate invoice
        </button>
      </div>

      {error && <SHCErrorBanner code={error.code} message={error.message} />}

      <SHCSectionTitle>Payment</SHCSectionTitle>
      <PayNowPanel amount={amountDue} reference={'WEB-' + Date.now().toString().slice(-6)} onRefChange={setPaynowRef} />

      <SHCButton
        className="mt-6 w-full"
        size="lg"
        onClick={doCheckout}
        disabled={!selected || checkoutMut.isPending}
        testID="complete-checkout-web"
      >
        {checkoutMut.isPending ? 'Placing order…' : 'Place order'}
      </SHCButton>
    </div>
  );
}