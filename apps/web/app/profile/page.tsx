'use client';

import React, { useState } from 'react';
import { useCredits, useRedeemCredits, useCreateRequest } from '../../lib/useProducts';
import { useNotifications } from '../../lib/useOrder';
import { SHCCard, SHCButton, WalletCard, CreditBadge, SHCSectionTitle } from '../components/SHCWebComponents';
import { useAuth } from '../../lib/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const redeem = useRedeemCredits();
  const createReq = useCreateRequest();
  const { data: notifs = [] } = useNotifications();
  const [reqBody, setReqBody] = useState('Nasi lemak sambal for Hari Raya open house 6 pax');
  const [party, setParty] = useState(6);

  const handleRequest = async () => {
    await createReq.mutateAsync({ body: reqBody, party_size: party, budget_cents: 14000, date: '2026-06-25' });
    alert('Request posted (visible on cook collab board). Same as mobile profile request.');
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold">Profile • {user.name} ({user.role})</h1>
      <p className="text-xs">PDPA consent: {user.pdpa_consent_at || '—'} (v1)</p>

      <SHCSectionTitle>Home Credits Wallet (earn 5% on collected)</SHCSectionTitle>
      <WalletCard balance={credits?.balance || 0} tier={credits?.tier} />
      <div className="flex gap-2 mt-2">
        <SHCButton size="sm" onClick={()=>redeem.mutate(20)} disabled={(credits?.balance||0)<20}>Redeem 20 units (demo)</SHCButton>
        <span className="text-xs self-center text-[#5C5144]">Applies at checkout automatically if selected.</span>
      </div>

      <SHCSectionTitle>Request Custom Dish (bidding/collaboration)</SHCSectionTitle>
      <SHCCard>
        <textarea value={reqBody} onChange={e=>setReqBody(e.target.value)} className="w-full mb-2" />
        <input value={party} onChange={e=>setParty(parseInt(e.target.value)||4)} type="number" className="w-20 mr-2" /> pax
        <SHCButton className="ml-2" onClick={handleRequest} testID="request-dish-web">Submit Request (Phase 8 parity)</SHCButton>
      </SHCCard>

      <SHCSectionTitle>Notifications (in-app bell stub)</SHCSectionTitle>
      <ul className="text-sm">
        {notifs.map((n:any,i:number)=><li key={i}>• {n.body} <span className="text-xs">({n.created_at?.slice(11,16)})</span></li>)}
      </ul>

      <div className="mt-6 text-xs">Full growth features (request + bid + credit earn/redeem + heritage + AI/photo) shared contracts. Switch to cook for Collab Board.</div>
    </div>
  );
}
