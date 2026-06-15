'use client';

import React from 'react';
import Link from 'next/link';
import { useCart, useClearCart } from '../../lib/useProducts';
import { SHCCard, SHCButton, SHCEmptyState, SHCPageHeader, PriceEarningsCalc } from '../components/SHCWebComponents';

export default function CartPage() {
  const { data: cart = { items: [] }, isLoading } = useCart();
  const clear = useClearCart();
  const total = (cart.items || []).reduce((s: number, i: { price: number; qty: number }) => s + i.price * i.qty, 0);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCPageHeader title="Your cart" />
        <p className="text-[#5C5144]">Loading…</p>
      </div>
    );
  }

  const items = cart.items || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SHCPageHeader
        title="Your cart"
        subtitle="One cook per order — all dishes must come from the same home kitchen."
        backHref="/"
        backLabel="Continue browsing"
      />

      {items.length === 0 ? (
        <SHCEmptyState
          title="Your cart is empty"
          description="Browse heritage dishes for your next Hari Raya, CNY, or family gathering."
          action={
            <Link href="/">
              <SHCButton>Discover dishes</SHCButton>
            </Link>
          }
        />
      ) : (
        <>
          <SHCCard>
            <ul className="divide-y divide-[#E8D5B7]/60">
              {items.map((it: { name: string; qty: number; price: number }, idx: number) => (
                <li key={idx} className="py-3 flex justify-between items-start gap-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-[#5C5144]">
                      {it.qty} × S${it.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold tabular-nums">S${(it.qty * it.price).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-[#E8D5B7] flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-semibold tabular-nums">S${total.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <PriceEarningsCalc total={total} />
            </div>
          </SHCCard>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/checkout" className="flex-1">
              <SHCButton className="w-full" testID="proceed-checkout-web" size="lg">
                Proceed to checkout
              </SHCButton>
            </Link>
            <SHCButton variant="ghost" onClick={() => clear.mutate()}>
              Clear cart
            </SHCButton>
          </div>
        </>
      )}
    </div>
  );
}