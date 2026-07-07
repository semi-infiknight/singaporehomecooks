'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { getDishImageUrl } from '@shc/utils';
import { useCart, useClearCart } from '../../lib/useProducts';
import { isAuthenticated } from '../../lib/api-client';
import { useAuth } from '../../lib/useAuth';
import { enforceMinimumOrder } from '@shc/business-rules';
import { useShcI18n, getCartScreenCopy } from '@shc/i18n';
import {
  GourmeatScreenHeader,
  GourmeatPayButton,
  SHCEmptyState,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../components/SHCWebComponents';

type CartItem = {
  name: string;
  qty: number;
  price: number;
  product_id?: string;
  productId?: string;
};

export default function CartPage() {
  const router = useRouter();
  const { locale } = useShcI18n();
  const cartCopy = getCartScreenCopy(locale);
  const { user } = useAuth();
  const { openTray, dismiss } = useSHCTrayWeb();
  const { data: cart = { items: [] }, isLoading } = useCart();
  const clear = useClearCart();
  const total = (cart.items || []).reduce((s: number, i: CartItem) => s + i.price * i.qty, 0);
  const itemCount = (cart.items || []).reduce((s: number, i: CartItem) => s + i.qty, 0);

  const showGuestAuthTray = useCallback(() => {
    openTray(
      { id: 'guest-auth', title: cartCopy.signInTitle, height: 'compact' },
      <SHCTrayActionWeb
        message={cartCopy.signInBodyWeb}
        primaryLabel={cartCopy.signInBtn}
        onPrimary={() => {
          dismiss();
          router.push('/login');
        }}
        secondaryLabel={cartCopy.keepBrowsing}
        onSecondary={dismiss}
        testID="guest-auth-tray-web"
      />
    );
  }, [cartCopy, dismiss, openTray, router]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-muted-foreground font-semibold">{cartCopy.loading}</p>
      </div>
    );
  }

  const items = (cart.items || []) as CartItem[];
  const belowMinimum =
    items.length > 0 &&
    !enforceMinimumOrder({
      totalCents: Math.round(total * 100),
      lines: items.map((i) => ({ price_cents: Math.round(i.price * 100) })),
    }).valid;

  return (
    <div className={`max-w-2xl mx-auto px-4 py-8 ${items.length > 0 ? 'pb-28' : ''}`}>
      <GourmeatScreenHeader
        title={cartCopy.title}
        subtitle={cartCopy.headerPortions(itemCount)}
      />

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-card)] p-8">
          <SHCEmptyState
            title={cartCopy.emptyTitle}
            action={
              <Link href="/" className="inline-block mt-4">
                <GourmeatPayButton
                  label={cartCopy.browseDishes}
                  onClick={() => {
                    window.location.href = '/';
                  }}
                />
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-soft)] p-4 text-center">
              <div className="text-2xl font-extrabold tabular-nums">{itemCount}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">{cartCopy.portionsLabel}</div>
            </div>
            <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-soft)] p-4 text-center">
              <div className="text-2xl font-extrabold tabular-nums text-primary">S${total.toFixed(2)}</div>
              <div className="text-xs font-semibold text-muted-foreground mt-1">{cartCopy.subtotalLabel}</div>
            </div>
          </div>

          {belowMinimum && (
            <p
              className="mb-4 rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-peach-50)] p-3 text-sm font-semibold text-foreground"
              data-testid="cart-minimum-hint"
            >
              {cartCopy.minimumHint}
            </p>
          )}

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
              <span className="font-extrabold text-base">{cartCopy.totalLabel}</span>
              <span className="text-xl font-extrabold tabular-nums text-primary">S${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => clear.mutate()}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
            {cartCopy.clearCart}
          </button>

          <GourmeatPayButton
            label={cartCopy.checkoutBtn}
            amount={`S$${total.toFixed(2)}`}
            testID="proceed-checkout-web"
            onClick={() => {
              if (!user && !isAuthenticated()) {
                showGuestAuthTray();
                return;
              }
              router.push('/checkout');
            }}
          />
        </>
      )}
    </div>
  );
}
