'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrder, useChat, useTransitionOrder } from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import { SHCCard, SHCButton, SHCSectionTitle } from '../../components/SHCWebComponents';
import { SHCOrderStatus } from '@shc/types';

export default function TrackOrder() {
  const params = useParams<{id:string}>();
  const id = params?.id as string;
  const { data: order } = useOrder(id);
  const { messages, send } = useChat(id);
  const { user } = useAuth();
  const transMut = useTransitionOrder();
  const [msg, setMsg] = useState('');
  const [refInput, setRefInput] = useState('');

  if (!order) return <p>Loading order (shared state + contracts)...</p>;

  const handleTransition = async (to: SHCOrderStatus) => {
    try { await transMut.mutateAsync({orderId: id, to}); } catch(e){ alert((e as any).message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Track {id}</h1>
      <SHCCard>
        <div>Status: <strong>{order.shc_status}</strong> • {order.collection_date} {order.collection_slot}</div>
        <div>Total S${order.total} • Cook: {order.cook_name}</div>
        {order.paynow_reference && <div>PayNow ref: {order.paynow_reference}</div>}
        <div className="mt-1 text-xs">Address released ~2h before slot (post paid). Collection instructions in cook profile.</div>
      </SHCCard>

      <SHCSectionTitle>Order Chat (polling 4.5s parity)</SHCSectionTitle>
      <div className="border bg-white p-3 rounded h-48 overflow-auto mb-2 text-sm">
        {messages.map((m:any,i:number)=> <div key={i} className={m.sender_actor==='cook'?'text-[#1D9E75]':'text-[#B85C38]'}><strong>{m.sender_actor}:</strong> {m.body}</div>)}
      </div>
      <div className="flex gap-2">
        <input value={msg} onChange={e=>setMsg(e.target.value)} className="flex-1" placeholder="Message..." />
        <SHCButton size="sm" onClick={()=>{ if(msg) { send({body:msg, from: user.role==='cook'?'cook':'customer'}); setMsg(''); }}}>Send</SHCButton>
      </div>

      {user.role==='cook' && (
        <div className="mt-4">
          <SHCSectionTitle>Cook Actions (state machine)</SHCSectionTitle>
          <div className="flex gap-2 flex-wrap">
            {['accepted','preparing','ready','collected','completed'].map((st,i)=> <SHCButton key={i} size="sm" onClick={()=>handleTransition(st as any)}>{st}</SHCButton>)}
          </div>
          <p className="text-xs mt-1">Transitions validated by 09-order-state + business-rules. Earnings post on completed.</p>
        </div>
      )}

      <a href="/cook-portal" className="underline text-sm mt-6 block">Back to Cook Portal (or switch role)</a>
    </div>
  );
}
