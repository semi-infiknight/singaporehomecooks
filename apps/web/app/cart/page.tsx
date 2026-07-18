'use client';

/**
 * One-time order cart (HomelyEats cart IA).
 * Kitchen · collection location · items · instructions · summary · Proceed to pay.
 */
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, MapPin } from 'lucide-react';
import {
  getDishImageUrl,
  computeOneTimeOrderSummary,
  cartKitchenLabel,
  cartCollectionHint,
  CART_WIREFRAME_LABELS,
} from '@shc/utils';
import { useCart, useClearCart } from '../../lib/useProducts';
import { isAuthenticated } from '../../lib/api-client';
import { useAuth } from '../../lib/useAuth';
import { useAcceptBid, useBids, useMyRequests } from '../../lib/useOrder';
import { useCustomerLocation } from '../../lib/useCustomerLocation';
import {
  GourmeatScreenHeader,
  GourmeatPayButton,
  SHCEmptyState,
  SHCButton,
  SHCSkeletonList,
  SHCSectionTitle,
  SHCCard,
  SHCBadge,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../components/SHCWebComponents';

type RequestRow = {
  id: string;
  body?: string;
  status?: string;
  party_size?: number;
  budget_cents?: number;
};

type BidRow = {
  id: string;
  status?: string;
  price_cents?: number;
  message?: string;
};

function MyRequestCard({ request }: { request: RequestRow }) {
  const { data: bids = [] } = useBids(request.id);
  const acceptBid = useAcceptBid();
  const pendingBids = (bids as BidRow[]).filter((bid) => bid.status === 'pending');

  return (
    <SHCCard className="mb-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-bold text-foreground flex-1">{request.body}</p>
        <SHCBadge variant={request.status === 'matched' ? 'success' : 'warning'}>
          {request.status || 'open'}
        </SHCBadge>
      </div>
      <p className="text-xs text-muted-foreground font-semibold mb-3">
        {request.party_size ? `${request.party_size} pax · ` : ''}
        {request.budget_cents
          ? `Budget S$${Math.round(request.budget_cents / 100)}`
          : 'Open budget'}
      </p>
      {pendingBids.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending bids yet. Cooks respond from their dashboard.</p>
      ) : (
        <ul className="space-y-2">
          {pendingBids.map((bid) => (
            <li key={bid.id} className="flex items-center justify-between gap-3 border-t-2 border-[var(--shc-border-brutal)] pt-2">
              <div className="min-w-0">
                <p className="font-black tabular-nums">S${Math.round((bid.price_cents || 0) / 100)}</p>
                {bid.message && <p className="text-sm text-muted-foreground truncate">{bid.message}</p>}
              </div>
              <SHCButton
                size="sm"
                onClick={() => acceptBid.mutate(bid.id)}
                disabled={acceptBid.isPending}
                data-testid={`accept-bid-${bid.id}`}
              >
                Accept
              </SHCButton>
            </li>
          ))}
        </ul>
      )}
    </SHCCard>
  );
}

function MyRequestsPanel({ enabled }: { enabled: boolean }) {
  const { data: myRequests = [] } = useMyRequests();

  if (!enabled) return null;

  return (
    <div className="mt-8 mb-6" data-testid="my-requests-panel">
      <SHCSectionTitle subtitle="Review cook bids and accept one to create your order">My requests</SHCSectionTitle>
      {myRequests.length === 0 ? (
        <SHCCard>
          <p className="text-sm text-muted-foreground font-semibold">No dish requests yet.</p>
          <Link href="/request" className="inline-block mt-3">
            <SHCButton size="sm" variant="outline" data-testid="cart-request-dish-btn">
              Request a dish
            </SHCButton>
          </Link>
        </SHCCard>
      ) : (
        <div>
          {(myRequests as RequestRow[]).map((request) => (
            <MyRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

type CartItem = {
  name: string;
  qty: number;
  price: number;
  product_id?: string;
  productId?: string;
  cook_name?: string;
};

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openTray, dismiss } = useSHCTrayWeb();
  const { data: cart, isLoading } = useCart();
  const cartData = cart ?? { items: [] };
  const clear = useClearCart();
  const { locationLabel, active: collectionLocation } = useCustomerLocation();
  const [cookingNotes, setCookingNotes] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [showCooking, setShowCooking] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');

  const items = ((cartData as { items?: CartItem[] }).items || []) as CartItem[];
  const summary = computeOneTimeOrderSummary(items);
  const kitchen = cartKitchenLabel(items as Array<Record<string, unknown>>);

  const showGuestAuthTray = useCallback(() => {
    openTray(
      { id: 'guest-auth', title: 'Sign in to checkout', height: 'compact' },
      <SHCTrayActionWeb
        message="Create an account or sign in to complete your order and track collection."
        primaryLabel="Sign in"
        onPrimary={() => {
          dismiss();
          router.push('/login?next=/checkout');
        }}
        secondaryLabel="Keep browsing"
        onSecondary={dismiss}
        testID="guest-auth-tray-web"
      />
    );
  }, [dismiss, openTray, router]);

  if (isLoading && !cart) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="cart-screen">
        <GourmeatScreenHeader title="Cart" subtitle={cartCollectionHint()} />
        <SHCSkeletonList count={4} rowHeight={72} />
      </div>
    );
  }

  return (
    <div
      className={`max-w-2xl mx-auto px-4 py-6 ${items.length > 0 ? 'shc-sticky-footer-pad' : 'shc-tab-bar-pad'}`}
      data-testid="cart-screen"
    >
      <GourmeatScreenHeader title="Cart" subtitle={cartCollectionHint()} />

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
          {/* Wireframe: Delivery/collection address */}
          <div
            className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 mb-4"
            data-testid="cart-kitchen-banner"
          >
            <p className="text-xs font-bold text-muted-foreground">{CART_WIREFRAME_LABELS.collection}</p>
            <p className="font-black text-lg" data-testid="cart-kitchen-name">
              {kitchen}
            </p>
            <div className="flex items-start gap-2 mt-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" aria-hidden />
              <div className="flex-1 min-w-0">
                <p data-testid="cart-collection-location">
                  {collectionLocation ? locationLabel : 'Set collection location'}
                </p>
                <Link href="/location" className="text-primary font-bold text-xs">
                  Change
                </Link>
              </div>
            </div>
          </div>

          {/* Wireframe: Itemize */}
          <p className="text-sm font-extrabold mb-2">{CART_WIREFRAME_LABELS.items}</p>
          <div className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden mb-3">
            <ul className="divide-y divide-border" data-testid="cart-items-list">
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
                        {it.qty} × S${Number(it.price).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-extrabold text-primary tabular-nums shrink-0 text-sm">
                      S${(it.qty * it.price).toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            href="/"
            className="block w-full text-center rounded-xl border-2 border-dashed border-[var(--shc-border-brutal)] py-3 text-sm font-bold text-primary mb-3"
            data-testid="cart-add-more"
          >
            + Add more items
          </Link>

          <button
            type="button"
            className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3 mb-2 text-sm font-bold"
            onClick={() => setShowCooking((v) => !v)}
            data-testid="cart-cooking-notes-toggle"
          >
            Add cooking instructions
          </button>
          {showCooking && (
            <textarea
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 text-sm font-semibold mb-2 min-h-[72px]"
              placeholder="e.g. less spicy · no peanuts"
              value={cookingNotes}
              onChange={(e) => setCookingNotes(e.target.value)}
              data-testid="cart-cooking-notes"
            />
          )}

          <button
            type="button"
            className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3 mb-4 text-sm font-bold"
            onClick={() => setShowCollection((v) => !v)}
            data-testid="cart-collection-notes-toggle"
          >
            Add collection instructions
          </button>
          {showCollection && (
            <textarea
              className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 text-sm font-semibold mb-4 min-h-[72px]"
              placeholder="e.g. call when ready · leave at unit 12-34"
              value={collectionNotes}
              onChange={(e) => setCollectionNotes(e.target.value)}
              data-testid="cart-collection-notes"
            />
          )}

          {/* Wireframe: Apply coupon */}
          <div
            className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 mb-3"
            data-testid="cart-coupon-row"
          >
            <p className="font-extrabold mb-2 text-sm">{CART_WIREFRAME_LABELS.coupon}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter code or Home Credits"
                className="shc-input flex-1 py-2 text-sm"
                data-testid="cart-coupon-input"
              />
              <SHCButton
                size="sm"
                variant="outline"
                testID="cart-coupon-apply"
                onClick={() => {
                  const code = coupon.trim().toUpperCase();
                  if (!code) {
                    setCouponMsg('Enter a code to apply.');
                    return;
                  }
                  // Credits redeem at checkout — coupon shell for wireframe parity
                  setCouponMsg(
                    code === 'WELCOME' || code === 'SHC5'
                      ? 'Code noted — confirm at checkout with PayNow.'
                      : 'Unknown code. Use Home Credits at checkout instead.'
                  );
                }}
              >
                Apply
              </SHCButton>
            </div>
            {couponMsg ? (
              <p className="text-xs font-semibold text-muted-foreground mt-2">{couponMsg}</p>
            ) : null}
          </div>

          {/* Wireframe: Bill summary */}
          <div
            className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 mb-3"
            data-testid="cart-order-summary"
          >
            <p className="font-extrabold mb-3">{CART_WIREFRAME_LABELS.bill}</p>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="text-muted-foreground">Item total</span>
              <span className="tabular-nums">{summary.itemTotalLabel}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="text-muted-foreground">Service fee</span>
              <span className="tabular-nums">{summary.serviceFeeLabel}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-muted-foreground">HDB collection</span>
              <span className="tabular-nums text-green-700">{summary.collectionFeeLabel}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t-2 border-[var(--shc-border-brutal)] pt-2">
              <span>Total amount</span>
              <span className="text-primary tabular-nums" data-testid="cart-total">
                {summary.totalLabel}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground mt-3 bg-secondary/60 rounded-lg p-2">
              {summary.cancelNote}
            </p>
          </div>

          {/* Wireframe: Payment method */}
          <div
            className="rounded-2xl border-2 border-primary bg-[var(--shc-bento-yellow)]/40 p-4 mb-3"
            data-testid="cart-payment-method"
          >
            <p className="text-xs font-bold text-muted-foreground mb-1">{CART_WIREFRAME_LABELS.payment}</p>
            <p className="font-black text-sm">{CART_WIREFRAME_LABELS.paynow}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Transfer after placing order · confirm with reference
            </p>
          </div>

          <button
            type="button"
            onClick={() => clear.mutate()}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
            Clear cart
          </button>
        </>
      )}

      <MyRequestsPanel enabled={!!user} />

      {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 md:static p-4 md:p-0 bg-card/95 md:bg-transparent border-t-2 md:border-0 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),72px)] md:pb-0 z-30">
            <div className="max-w-2xl mx-auto">
              <GourmeatPayButton
                label={summary.proceedLabel}
                amount={summary.totalLabel}
                testID="proceed-checkout-web"
                onClick={() => {
                  if (!authLoading && !user && !isAuthenticated()) {
                    showGuestAuthTray();
                    return;
                  }
                  // Persist notes for checkout session
                  try {
                    sessionStorage.setItem(
                      'shc_cart_notes',
                      JSON.stringify({ cookingNotes, collectionNotes, kitchen })
                    );
                  } catch {
                    /* ignore */
                  }
                  router.push('/checkout');
                }}
              />
            </div>
          </div>
      )}
    </div>
  );
}
