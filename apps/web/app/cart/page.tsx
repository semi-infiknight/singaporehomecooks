'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { getDishImageUrl } from '@shc/utils';
import { useCart, useClearCart } from '../../lib/useProducts';
import { GourmeatScreenHeader, GourmeatPayButton, SHCEmptyState } from '../components/SHCWebComponents';

type CartItem = {
  name: string;
  qty: number;
  price: number;
  product_id?: string;
  productId?: string;
};

export default function CartPage() {
  const { data: cart = { items: [] }, isLoading } = useCart();
  const clear = useClearCart();
  const total = (cart.items || []).reduce((s: number, i: CartItem) => s + i.price * i.qty, 0);
  const itemCount = (cart.items || []).reduce((s: number, i: CartItem) => s + i.qty, 0);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-muted-foreground font-semibold">Loading…</p>
      </div>
    );
  }

  const items = (cart.items || []) as CartItem[];

  return (
    <div className={`max-w-2xl mx-auto px-4 py-8 ${items.length > 0 ? 'pb-28' : ''}`}>
      <GourmeatScreenHeader
        title="Your Cart"
        subtitle={`${itemCount} portion${itemCount !== 1 ? 's' : ''}`}
      />

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-card)] p-8">
          <SHCEmptyState
            title="Cart is empty"
            action={
              <Link href="/" className="inline-block mt-4">
                <GourmeatPayButton label="Discover dishes" onClick={() => { window.location.href = '/'; }} />
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-soft)] p-4 text-center">
              <div className="text-2xl font-extrabold tabular-nums">{itemCount}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">Portions</div>
            </div>
            <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-soft)] p-4 text-center">
              <div className="text-2xl font-extrabold tabular-nums text-primary">S${total.toFixed(2)}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">Subtotal</div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-card)] overflow-hidden mb-4">
            <ul className="divide-y divide-border">
              {items.map((it, idx) => {
                const pid = it.product_id || it.productId;
                const imgUrl = getDishImageUrl({ id: pid, name: it.name });
                return (
                  <li key={idx} className="py-3 px-4 flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                      <Image src={imgUrl} alt={it.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-sm">{it.name}</div>
                      <div className="text-xs text-muted-foreground font-medium tabular-nums">
                        {it.qty} × S${it.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-extrabold text-primary tabular-nums shrink-0 text-sm">
                      S${(it.qty * it.price).toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-4 border-t border-border flex justify-between items-center bg-secondary/50">
              <span className="font-extrabold text-base">Total</span>
              <span className="text-xl font-extrabold tabular-nums text-primary">S${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => clear.mutate()}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
            Clear cart
          </button>

          <GourmeatPayButton
            label="Checkout"
            amount={`S$${total.toFixed(2)}`}
            testID="proceed-checkout-web"
            onClick={() => { window.location.href = '/checkout'; }}
          />
        </>
      )}
    </div>
  );
}