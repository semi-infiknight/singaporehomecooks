'use client';

import React, { useState } from 'react';
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SHCPageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Manage your Home Credits, request custom dishes, and view notifications."
      />

      <SHCSectionTitle subtitle="Earn 5% back on every collected order">Home Credits</SHCSectionTitle>
      <WalletCard balance={credits?.balance || 0} tier={credits?.tier} />
      <div className="mt-3 flex flex-wrap gap-3 items-center">
        <SHCButton
          size="sm"
          variant="outline"
          onClick={() => redeem.mutate(20)}
          disabled={(credits?.balance || 0) < 20}
        >
          Redeem 20 credits
        </SHCButton>
        <span className="text-xs text-[#5C5144]">Credits apply automatically at checkout when you choose.</span>
      </div>

      <SHCSectionTitle subtitle="Can't find what you need? Cooks can bid on your request">
        Request a custom dish
      </SHCSectionTitle>
      <SHCCard>
        <label className="block text-sm font-medium mb-1.5">What are you looking for?</label>
        <textarea
          value={reqBody}
          onChange={(e) => setReqBody(e.target.value)}
          className="shc-input min-h-[100px] resize-y"
          placeholder="Describe your occasion, dietary needs, and preferred cuisine…"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[#5C5144]">Party size</span>
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
        <p className="text-xs text-[#5C5144] mt-3">
          Verified cooks will see your request and can submit bids with pricing and availability.
        </p>
      </SHCCard>

      <SHCSectionTitle>Notifications</SHCSectionTitle>
      <SHCCard>
        {notifs.length === 0 ? (
          <p className="text-sm text-[#5C5144] py-4 text-center">You&apos;re all caught up — no new notifications.</p>
        ) : (
          <ul className="divide-y divide-[#E8D5B7]/60">
            {(notifs as Array<{ body?: string; created_at?: string }>).map((n, i) => (
              <li key={i} className="py-3 text-sm first:pt-0 last:pb-0">
                <span className="text-[#2C2416]">{n.body}</span>
                {n.created_at && (
                  <span className="text-xs text-[#5C5144] ml-2">{n.created_at.slice(11, 16)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SHCCard>
    </div>
  );
}