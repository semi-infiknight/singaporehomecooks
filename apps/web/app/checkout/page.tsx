'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useCredits } from '../../lib/useProducts';
import { useCheckout } from '../../lib/useOrder';
import { useCollectionSlots } from '../../lib/useProducts';
import { SHCCard, SHCButton, SHCErrorBanner, AllergenAckCheckbox, CollectionSlotPicker, PayNowPanel, CreditBadge, WalletCard, SHCSectionTitle } from '../components/SHCWebComponents';
import { flagCorporateOrder } from '../../lib/api-client';
import { createSHCError } from '../../lib/api-client';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart = {items:[] } } = useCart();
  const checkoutMut = useCheckout();
  const { data: creditsData } = useCredits();

  const [allergenAck, setAllergenAck] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [selected, setSelected] = useState<{date:string;slot:string} | null>(null);
  const [error, setError] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paynowRef, setPaynowRef] = useState('');
  const [creditsApply, setCreditsApply] = useState(0);
  const [isCorp, setIsCorp] = useState(false);

  const firstPid = (cart.items||[])[0]?.productId;
  const { data: slots=[] } = useCollectionSlots(firstPid || '');
  const total = (cart.items||[]).reduce((s:number,i:any)=>s+i.price*i.qty,0);
  const creditBal = creditsData?.balance || 0;

  const doCheckout = async () => {
    setError(null);
    if (!allergenAck) { setError({code:'SHC-CART-003', message:'Allergen ack mandatory'}); return; }
    if (!pdpaConsent) { setError({code:'SHC-GENERIC-001', message:'PDPA consent required (compliance-pdpa)'}); return; }
    if (!selected) { setError({code:'SHC-AVAIL-001', message:'Select collection slot'}); return; }
    try {
      const res: any = await checkoutMut.mutateAsync({ allergenAck, collection: selected, pdpaConsent, creditsToApply: creditsApply, isCorporate: isCorp });
      const oid = res?.order?.id || res?.id || 'SHC-DEMO-' + Date.now();
      setOrderId(oid);
      if (isCorp) await flagCorporateOrder('Web checkout corporate stub');
    } catch(e:any) {
      setError({code: e?.code, message: e?.message || 'Checkout blocked by rules'});
    }
  };

  if (orderId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Order placed: {orderId}</h1>
        <p>PayNow ref: enter below to simulate. Then track in orders. Same flow as mobile + backend transition.</p>
        <PayNowPanel amount={total} reference={paynowRef || orderId} onRefChange={setPaynowRef} />
        <SHCButton className="mt-3" onClick={() => router.push(`/orders/${orderId}`)}>Track Order / Chat (polling)</SHCButton>
        <div className="text-xs mt-4">Post paid, use cook dashboard to transition paid→accepted→ready→collected (earnings + credits auto).</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold">Checkout (One Cook • PDPA • Credits • PayNow)</h1>

      <SHCCard className="mt-4">
        <div>Total S${total} • {cart.items?.length} items</div>
        <div className="text-sm">Cook: {(cart.items||[])[0]?.cookId}</div>
      </SHCCard>

      <SHCSectionTitle>Collection Slot</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={selected} onSelect={(d,s)=>setSelected({date:d,slot:s})} />

      <SHCSectionTitle>Allergen Ack + PDPA Consent (hardened)</SHCSectionTitle>
      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-checkout-web" />
      <label className="mt-3 flex gap-2 text-sm">
        <input type="checkbox" checked={pdpaConsent} onChange={e=>setPdpaConsent(e.target.checked)} data-testid="pdpa-consent-web" /> I consent to PDPA processing of my order &amp; contact data (v1.0-pdpa-2025). Explicit consent required.
      </label>

      {/* Credits + corporate Phase 8/9 */}
      <SHCSectionTitle>Apply Home Credits + Corporate</SHCSectionTitle>
      <WalletCard balance={creditBal} tier={creditsData?.tier} />
      <div className="mt-2 flex gap-2 items-center text-sm">
        <input type="number" min={0} max={creditBal} value={creditsApply} onChange={e=>setCreditsApply(Math.min(creditBal, parseInt(e.target.value)||0))} className="w-20" />
        <span>units to apply (~S${(creditsApply/4).toFixed(0)})</span>
        <button onClick={()=>setIsCorp(!isCorp)} className={`text-xs px-2 py-1 border rounded ${isCorp?'bg-[#B85C38] text-white':''}`}>Corporate order (invoice stub)</button>
      </div>

      {error && <SHCErrorBanner code={error.code} message={error.message} />}

      <SHCSectionTitle>PayNow (sim — capture ref)</SHCSectionTitle>
      <PayNowPanel amount={Math.max(0, total - Math.floor(creditsApply/4))} reference={orderId || 'WEB-'+Date.now().toString().slice(-6)} onRefChange={setPaynowRef} />

      <div className="mt-4">
        <SHCButton onClick={doCheckout} disabled={!selected} testID="complete-checkout-web">Complete Order (enforce gates, create order)</SHCButton>
      </div>
      <p className="text-[10px] mt-2 text-[#5C5144]">After this, switch to cook role + dashboard. Full money engine (ledger) via shared backend on transition to completed.</p>
    </div>
  );
}
