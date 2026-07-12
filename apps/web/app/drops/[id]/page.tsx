'use client';

/**
 * Cooking soon — add batch to cart → existing checkout (one-cook + PayNow).
 */
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDropCookDate, formatDropOrderBy, formatDropPrice } from '@shc/utils';
import { useAuth } from '../../../lib/useAuth';
import { useDrop, useAddDropToCart } from '../../../lib/useOrder';
import { SHCBadge, SHCButton, SHCCard, SHCLoading, SHCPageHeader } from '../../components/SHCWebComponents';

export default function DropOrderPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: drop, isLoading, error } = useDrop(id);
  const addMut = useAddDropToCart();
  const [qty, setQty] = useState(1);
  const [localError, setLocalError] = useState('');

  const remaining = Number(drop?.remaining_qty ?? drop?.max_qty ?? 0);
  const maxCan = Math.max(1, remaining || 1);
  const total = useMemo(() => {
    if (!drop) return 0;
    const unit = drop.price != null ? Number(drop.price) : Number(drop.price_cents || 0) / 100;
    return unit * qty;
  }, [drop, qty]);

  async function goToCheckout() {
    setLocalError('');
    if (!user) {
      router.push(`/login?next=/drops/${encodeURIComponent(id)}`);
      return;
    }
    try {
      await addMut.mutateAsync({ id, qty });
      // Real cart → checkout path (one-cook + allergen/PDPA/PayNow)
      router.push(`/checkout?dropId=${encodeURIComponent(id)}`);
    } catch (e: any) {
      setLocalError(e?.message || e?.error?.message || 'Could not add batch to cart');
    }
  }

  if (isLoading || authLoading) return <SHCLoading label="Loading batch…" />;
  if (error || !drop) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="font-bold text-red-700">Batch not found or no longer available.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-primary underline">
          Back home
        </Link>
      </div>
    );
  }

  const open = drop.status === 'open' && remaining > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-8" data-testid="drop-order-page">
      <SHCPageHeader
        title={drop.title}
        subtitle={`${drop.cook_name || 'Home kitchen'} · Cooking soon`}
      />

      <SHCCard className="mt-4 p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <SHCBadge variant="heritage">{formatDropCookDate(drop.cook_date)}</SHCBadge>
          <SHCBadge variant="default">{drop.collection_slot}</SHCBadge>
          <SHCBadge variant={open ? 'success' : 'warning'}>{String(drop.status).replace(/_/g, ' ')}</SHCBadge>
        </div>
        <p className="text-2xl font-black text-primary">{formatDropPrice(drop.price_cents, drop.price)}</p>
        <p className="text-sm font-semibold text-muted-foreground">
          {remaining} of {drop.max_qty} left · order by {formatDropOrderBy(drop.order_by)}
        </p>
        {drop.note && <p className="text-sm font-semibold">{drop.note}</p>}
        <p className="text-xs text-muted-foreground">
          Collection is fixed to this batch. Checkout uses the normal cart path (one kitchen).
        </p>
      </SHCCard>

      <SHCCard className="mt-4 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black">Quantity</p>
          <div className="flex items-center gap-2">
            <SHCButton
              size="sm"
              variant="outline"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              testID="drop-qty-dec"
            >
              −
            </SHCButton>
            <span className="w-10 text-center text-lg font-black" data-testid="drop-qty">
              {qty}
            </span>
            <SHCButton
              size="sm"
              variant="outline"
              disabled={qty >= maxCan}
              onClick={() => setQty((q) => Math.min(maxCan, q + 1))}
              testID="drop-qty-inc"
            >
              +
            </SHCButton>
          </div>
        </div>
        <p className="text-sm font-extrabold">
          Total <span className="text-primary">S${total.toFixed(2)}</span>
        </p>
        {(localError || addMut.isError) && (
          <p className="text-sm font-bold text-red-700" data-testid="drop-order-error">
            {localError || (addMut.error as Error)?.message}
          </p>
        )}
        <SHCButton
          className="w-full"
          disabled={!open || addMut.isPending}
          onClick={goToCheckout}
          testID="drop-order-submit"
        >
          {addMut.isPending
            ? 'Adding…'
            : open
              ? `Continue to checkout · ${formatDropCookDate(drop.cook_date)}`
              : 'Unavailable'}
        </SHCButton>
        {drop.cook_slug && (
          <Link
            href={`/cook/${drop.cook_slug}`}
            className="block text-center text-sm font-bold text-primary underline"
          >
            View kitchen
          </Link>
        )}
      </SHCCard>
    </div>
  );
}
