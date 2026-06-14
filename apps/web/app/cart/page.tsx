'use client';

import React from 'react';
import Link from 'next/link';
import { useCart, useClearCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { SHCCard, SHCButton, SHCSectionTitle, PriceEarningsCalc } from '../components/SHCWebComponents';

export default function CartPage() {
  const { data: cart = {items:[]}, isLoading } = useCart();
  const clear = useClearCart();
  const { user } = useAuth();

  const total = (cart.items || []).reduce((s:number,i:any)=>s + i.price * i.qty, 0);

  if (isLoading) return <p>Loading cart...</p>;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Your Cart — {cart.cookId ? 'One Cook Enforced' : 'Empty'}</h1>
      <p className="text-sm text-[#5C5144]">Same enforcement + seeds as Expo mobile cart.</p>

      {(!cart.items || cart.items.length === 0) ? (
        <SHCCard className="mt-4"><p>No items yet. Browse discover, pick heritage dishes (min qty enforced by business-rules).</p><Link href="/"><SHCButton className="mt-2">Discover dishes</SHCButton></Link></SHCCard>
      ) : (
        <SHCCard className="mt-4">
          {(cart.items||[]).map((it:any, idx:number)=> (
            <div key={idx} className="py-1 border-b last:border-0">{it.qty}× {it.name} @ S${it.price} = S${(it.qty*it.price).toFixed(2)}</div>
          ))}
          <div className="mt-3 font-semibold text-lg">Total S${total}</div>
          <PriceEarningsCalc total={total} />
        </SHCCard>
      )}

      {cart.items?.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 max-w-xs">
          <Link href="/checkout"><SHCButton testID="proceed-checkout-web">Proceed to Checkout (PayNow + PDPA + Slots + Credits)</SHCButton></Link>
          <SHCButton variant="outline" onClick={()=>clear.mutate()}>Clear Cart</SHCButton>
        </div>
      )}

      <p className="mt-8 text-xs">Rules active: one-cook, min-qty, allergen ack, PDPA explicit consent. See production/compliance-pdpa.md.</p>
    </div>
  );
}
