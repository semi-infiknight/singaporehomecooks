'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import {
  useCookOrders,
  useOpenRequests,
  useCreateBid,
} from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  SHCBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';
import {
  useShcI18n,
  getCookQuickActionLabels,
  getCookDashboardExtras,
  getLocalizedOrderStatus,
} from '@shc/i18n';

export default function CookDashboardPage() {
  const { user } = useCookAuth();
  const { t, locale } = useShcI18n();
  const quick = getCookQuickActionLabels(locale);
  const dashExtras = getCookDashboardExtras(locale);
  const { data: orders = [] } = useCookOrders();
  const { data: openReqs = [] } = useOpenRequests();
  const createBid = useCreateBid();
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [collabMsg, setCollabMsg] = useState('');

  const quickActions = useMemo(
    () => [
      { href: '/cook-portal/listings', label: quick.listings, image: BENTO_ACTION_IMAGES.listings, variant: 'bento-peach' as const },
      { href: '/cook-portal/orders', label: quick.orders, image: BENTO_ACTION_IMAGES.orders, variant: 'bento-mint' as const },
      { href: '/cook-portal/earnings', label: quick.earnings, image: BENTO_ACTION_IMAGES.earnings, variant: 'bento-yellow' as const },
      { href: '/cook-portal/compliance', label: quick.compliance, image: BENTO_ACTION_IMAGES.compliance, variant: 'bento-peach' as const },
    ],
    [quick]
  );

  const earnings = orders
    .filter((o: { shc_status?: string }) => o.shc_status === 'completed')
    .reduce((s: number, o: { total?: number }) => s + Math.floor((o.total || 0) * 0.85), 0);

  const handleBid = async (reqId: string) => {
    const price = parseInt(bidPrices[reqId] || '1200', 10);
    await createBid.mutateAsync({
      requestId: reqId,
      priceCents: price,
      message: collabMsg || dashExtras.bidDefaultMessage,
    });
    setCollabMsg('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-dashboard">
      <GourmeatCookHeader
        title={t('cook.dashboard.greeting')}
        subtitle={dashExtras.dashboardSubtitle(user?.name || '')}
        testID="cook-dashboard-hero"
        badges={
          <>
            <SHCBadge variant="heritage">{t('cook.dashboard.payout_badge')}</SHCBadge>
            <SHCBadge variant="success">{dashExtras.earningsBadge(earnings)}</SHCBadge>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2 mb-6">
        <GourmeatCard appearance="cook" className="bg-[var(--shc-bento-mint)] text-center col-span-1">
          <p className="text-xs font-bold text-muted-foreground">{t('cook.dashboard.this_week')}</p>
          <p className="text-2xl font-black text-primary">S${earnings}</p>
        </GourmeatCard>
        <GourmeatCard appearance="cook" className="bg-[var(--shc-bento-yellow)] text-center">
          <p className="text-xs font-bold text-muted-foreground">{t('cook.dashboard.active')}</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </GourmeatCard>
        <GourmeatCard appearance="cook" className="bg-[var(--shc-bento-peach)] text-center">
          <p className="text-xs font-bold text-muted-foreground">{t('cook.dashboard.requests')}</p>
          <p className="text-2xl font-black">{openReqs.length}</p>
        </GourmeatCard>
      </div>

      <p className="text-sm font-extrabold text-foreground mb-2">{t('cook.dashboard.quick_actions')}</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {quickActions.slice(0, 2).map((a) => (
          <VisualBentoTile
            key={a.href}
            imageUrl={a.image}
            label={a.label}
            href={a.href}
            variant={a.variant}
            badge={a.label === quick.orders && orders.length ? orders.length : undefined}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {quickActions.slice(2).map((a) => (
          <VisualBentoTile key={a.href} imageUrl={a.image} label={a.label} href={a.href} variant={a.variant} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-extrabold text-foreground">{t('cook.dashboard.collab_board')}</p>
        {openReqs.length > 0 ? (
          <SHCBadge variant="warning">{dashExtras.openRequestsBadge(openReqs.length)}</SHCBadge>
        ) : null}
      </div>
      <GourmeatCard appearance="cook" className="mb-6 bg-[var(--shc-bento-peach)]">
        {openReqs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('cook.dashboard.no_requests')}</p>
        ) : (
          openReqs.map((r: { id: string; body?: string; party_size?: number; budget_cents?: number; date?: string }) => (
            <div key={r.id} className="bg-card rounded-xl p-3 mb-3 last:mb-0 shadow-[var(--shc-shadow-soft)]" data-testid={`collab-req-${r.id}`}>
              <p className="font-bold text-sm line-clamp-2">{r.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <SHCBadge variant="heritage">{dashExtras.guestsBadge(r.party_size || '?')}</SHCBadge>
                <SHCBadge variant="default">
                  S${r.budget_cents ? (r.budget_cents / 100).toFixed(0) : '—'}
                </SHCBadge>
                {r.date ? <SHCBadge variant="default">{r.date}</SHCBadge> : null}
              </div>
              <input
                className="shc-input mt-2"
                placeholder={t('cook.dashboard.bid_placeholder')}
                value={bidPrices[r.id] || ''}
                onChange={(e) => setBidPrices((p) => ({ ...p, [r.id]: e.target.value }))}
              />
              <GourmeatPrimaryButton
                label={t('cook.dashboard.bid_btn')}
                className="mt-2"
                onClick={() => handleBid(r.id)}
                testID={`bid-btn-${r.id}`}
              />
            </div>
          ))
        )}
      </GourmeatCard>

      <p className="text-sm font-extrabold text-foreground mb-2">{dashExtras.recentOrders}</p>
      {orders.length === 0 ? (
        <GourmeatCard appearance="cook">
          <p className="text-sm text-muted-foreground text-center">{dashExtras.noOrdersYet}</p>
        </GourmeatCard>
      ) : (
        orders.slice(0, 4).map((o: Record<string, unknown>) => (
          <GourmeatOrderRow
            key={String(o.id)}
            orderId={String(o.id)}
            dishName={String((o.items as { name?: string }[])?.[0]?.name || '')}
            productId={String((o.items as { product_id?: string }[])?.[0]?.product_id || '')}
            statusLabel={getLocalizedOrderStatus(locale, String(o.shc_status || ''))}
            collectionDate={o.collection_date ? String(o.collection_date) : undefined}
            collectionSlot={o.collection_slot ? String(o.collection_slot) : undefined}
            total={o.total as number}
            href={`/cook-portal/orders/${o.id}`}
          />
        ))
      )}

      <Link href="/" className="block text-center text-xs font-semibold text-primary mt-8">
        {dashExtras.customerAppLink}
      </Link>
    </div>
  );
}
