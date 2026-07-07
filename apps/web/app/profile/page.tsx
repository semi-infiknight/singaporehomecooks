'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useCredits, useRedeemCredits } from '../../lib/useProducts';
import { useAcceptBid, useBids, useMyRequests, useNotifications } from '../../lib/useOrder';
import {
  SHCCard,
  SHCButton,
  WalletCard,
  SHCSectionTitle,
  GourmeatScreenHeader,
  HeritageStoryBanner,
  SHCBadge,
} from '../components/SHCWebComponents';
import { WebPushOptIn } from '../components/WebPushOptIn';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../../lib/useAuth';
import { useShcI18n, getWalletProfileCopy } from '@shc/i18n';

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
  const { t, locale } = useShcI18n();
  const profileCopy = getWalletProfileCopy(locale);
  const { data: bids = [] } = useBids(request.id);
  const acceptBid = useAcceptBid();
  const pendingBids = (bids as BidRow[]).filter((bid) => bid.status === 'pending');

  return (
    <SHCCard className="mb-3" variant="customer">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-bold text-foreground flex-1">{request.body}</p>
        <SHCBadge variant={request.status === 'matched' ? 'success' : 'warning'} soft>
          {profileCopy.requestStatusLabel(request.status || 'open')}
        </SHCBadge>
      </div>
      <p className="text-xs text-muted-foreground font-semibold mb-3">
        {profileCopy.requestMeta(request.party_size, request.budget_cents)}
      </p>
      {pendingBids.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('wallet.no_pending_bids')}</p>
      ) : (
        <ul className="space-y-2">
          {pendingBids.map((bid) => (
            <li key={bid.id} className="flex items-center justify-between gap-3 border-t border-border pt-2">
              <div className="min-w-0">
                <p className="font-black tabular-nums">S${Math.round((bid.price_cents || 0) / 100)}</p>
                {bid.message && <p className="text-sm text-muted-foreground truncate">{bid.message}</p>}
              </div>
              <SHCButton
                appearance="customer"
                size="sm"
                onClick={() => acceptBid.mutate(bid.id)}
                disabled={acceptBid.isPending}
                data-testid={`accept-bid-${bid.id}`}
              >
                {t('wallet.accept')}
              </SHCButton>
            </li>
          ))}
        </ul>
      )}
    </SHCCard>
  );
}

export default function Profile() {
  const { t, locale } = useShcI18n();
  const profileCopy = getWalletProfileCopy(locale);
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const redeem = useRedeemCredits();
  const { data: notifs = [], markRead } = useNotifications();
  const { data: myRequests = [] } = useMyRequests();
  const [showNotifs, setShowNotifs] = useState(false);

  const balance = credits?.balance || 0;
  const tier = credits?.tier || 'Silver';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-28 md:pb-10">
      <div className="flex items-start justify-between mb-6">
        <GourmeatScreenHeader
          title={profileCopy.greeting(user?.name?.split(' ')[0])}
          subtitle={profileCopy.subtitle(tier)}
        />
        <div className="relative mt-2">
          <button
            type="button"
            className="relative"
            aria-label={profileCopy.notificationsA11y}
            onClick={() => {
              const next = !showNotifs;
              setShowNotifs(next);
              if (next && (notifs as Array<{ read?: boolean }>).some((n) => !n.read)) {
                markRead({ all: true });
              }
            }}
          >
            <Bell className="w-6 h-6 text-muted-foreground" aria-hidden />
            {notifs.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black bg-primary text-primary-foreground border border-border rounded-full px-1">
                {notifs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <WalletCard balance={balance} tier={tier} />

      <div className="mt-4 mb-2">
        <HeritageStoryBanner href="/content/trust" />
      </div>

      <div className="mt-3">
        <SHCButton
          appearance="customer"
          size="sm"
          variant="outline"
          onClick={() => redeem.mutate(20)}
          disabled={balance < 20}
        >
          {t('wallet.redeem_20')}
        </SHCButton>
      </div>

      <SHCSectionTitle>{t('wallet.my_requests')}</SHCSectionTitle>
      {myRequests.length === 0 ? (
        <SHCCard variant="customer">
          <p className="text-sm text-muted-foreground font-semibold">{t('wallet.no_requests')}</p>
          <Link href="/request" className="inline-block mt-3">
            <SHCButton appearance="customer" size="sm" variant="outline">
              {t('wallet.request_dish')}
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

      <SHCSectionTitle>{t('wallet.notifications')}</SHCSectionTitle>
      <SHCCard variant="customer">
        {notifs.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl" aria-hidden>
              🛎️
            </span>
            <p className="text-sm text-muted-foreground mt-2 font-semibold">{t('wallet.all_caught_up')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(notifs as Array<{ body?: string; created_at?: string }>).map((n, i) => (
              <li key={i} className="py-3 text-sm flex items-start gap-2 first:pt-0 last:pb-0">
                <span aria-hidden>📬</span>
                <span className="text-foreground font-medium flex-1">{n.body}</span>
                {n.created_at && (
                  <span className="text-xs text-muted-foreground shrink-0">{n.created_at.slice(11, 16)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SHCCard>

      <LanguageSwitcher className="mb-4" />
      <WebPushOptIn />
    </div>
  );
}