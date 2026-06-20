'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, UtensilsCrossed, Wallet } from 'lucide-react';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCredits, useRedeemCredits, useCreateRequest } from '../../lib/useProducts';
import { useNotifications } from '../../lib/useOrder';
import { SHCCard, SHCButton, WalletCard, SHCSectionTitle, SHCPageHeader } from '../components/SHCWebComponents';
import { useAuth } from '../../lib/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const redeem = useRedeemCredits();
  const createReq = useCreateRequest();
  const { data: notifs = [] } = useNotifications();
  const [reqBody, setReqBody] = useState('Nasi lemak sambal for Hari Raya open house, 6 guests');
  const [party, setParty] = useState(6);

  const handleRequest = async () => {
    await createReq.mutateAsync({
      body: reqBody,
      party_size: party,
      budget_cents: 14000,
      date: '2026-06-25',
    });
  };

  const balance = credits?.balance || 0;
  const tier = credits?.tier || 'Silver';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-6">
        <SHCPageHeader title={`👋 ${user?.name?.split(' ')[0] || 'there'}`} />
        <div className="relative mt-2">
          <Bell className="w-6 h-6 text-muted-foreground" aria-hidden />
          {notifs.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black bg-primary text-primary-foreground border-2 border-[var(--shc-border-brutal)] rounded-full px-1">
              {notifs.length}
            </span>
          )}
        </div>
      </div>

      {/* Visual wallet hero */}
      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] mb-4 h-28">
        <Image src={BENTO_ACTION_IMAGES.credits} alt="" fill className="object-cover opacity-70" sizes="100vw" />
        <div className="relative z-10 flex items-center justify-between h-full px-5">
          <div>
            <div className="text-3xl font-black tabular-nums font-mono text-foreground">{balance}</div>
            <div className="text-xs font-bold text-muted-foreground">Home Credits · {tier}</div>
          </div>
          <span className="w-12 h-12 rounded-full bg-card border-2 border-[var(--shc-border-brutal)] flex items-center justify-center shadow-[var(--shc-shadow-brutal-sm)]" aria-hidden>
            <Wallet className="w-6 h-6 text-primary" />
          </span>
        </div>
      </div>

      <WalletCard balance={balance} tier={tier} />
      <div className="mt-3">
        <SHCButton
          size="sm"
          variant="outline"
          onClick={() => redeem.mutate(20)}
          disabled={balance < 20}
        >
          Redeem 20 credits
        </SHCButton>
      </div>

      <SHCSectionTitle>Request a dish</SHCSectionTitle>
      <div className="relative min-h-[200px] overflow-hidden rounded-xl border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)]">
        <Image src={BENTO_ACTION_IMAGES.request} alt="" fill className="object-cover opacity-30" sizes="100vw" />
        <SHCCard className="relative z-10 bg-card/95 backdrop-blur-sm border-0 shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="w-5 h-5 text-primary" aria-hidden />
            <span className="font-bold text-sm">Custom dish request</span>
          </div>
          <textarea
            value={reqBody}
            onChange={(e) => setReqBody(e.target.value)}
            className="shc-input min-h-[80px] resize-y"
            placeholder="Occasion, cuisine, dietary needs…"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              👥
              <input
                value={party}
                onChange={(e) => setParty(parseInt(e.target.value) || 4)}
                type="number"
                min={2}
                className="shc-input w-20 py-1.5"
              />
            </label>
            <SHCButton onClick={handleRequest} testID="request-dish-web">
              Post request
            </SHCButton>
          </div>
        </SHCCard>
      </div>

      <SHCSectionTitle>Notifications</SHCSectionTitle>
      <SHCCard>
        {notifs.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl" aria-hidden>
              🛎️
            </span>
            <p className="text-sm text-muted-foreground mt-2 font-semibold">All caught up</p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-[var(--shc-border-brutal)]">
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
    </div>
  );
}