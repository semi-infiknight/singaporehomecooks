'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrder, useChat, useTransitionOrder } from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import { SHCCard, SHCButton, SHCSectionTitle, SHCPageHeader, SHCLoading } from '../../components/SHCWebComponents';
import { SHCOrderStatus } from '@shc/types';

const statusLabels: Record<string, string> = {
  pending: 'Awaiting payment',
  paid: 'Payment received',
  accepted: 'Cook confirmed',
  preparing: 'Being prepared',
  ready: 'Ready for collection',
  collected: 'Collected',
  completed: 'Completed',
};

export default function TrackOrder() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: order, isLoading } = useOrder(id);
  const { messages, send } = useChat(id);
  const { user } = useAuth();
  const transMut = useTransitionOrder();
  const [msg, setMsg] = useState('');

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label="Loading order…" />
      </div>
    );
  }

  const status = order.shc_status || 'pending';

  const handleTransition = async (to: SHCOrderStatus) => {
    try {
      await transMut.mutateAsync({ orderId: id, to });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SHCPageHeader
        title={statusLabels[status] || String(status)}
        subtitle={`Order ${id}`}
        backHref="/orders"
        backLabel="All orders"
      />

      <SHCCard className="mb-6">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#5C5144]">Collection</span>
            <p className="font-medium mt-0.5">
              {order.collection_date} · {order.collection_slot}
            </p>
          </div>
          <div>
            <span className="text-[#5C5144]">Total</span>
            <p className="font-medium mt-0.5 tabular-nums">S${order.total}</p>
          </div>
          <div>
            <span className="text-[#5C5144]">Cook</span>
            <p className="font-medium mt-0.5">{order.cook_name}</p>
          </div>
          {order.paynow_reference && (
            <div>
              <span className="text-[#5C5144]">PayNow ref</span>
              <p className="font-medium mt-0.5 font-mono text-xs">{order.paynow_reference}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-[#5C5144] mt-4 pt-4 border-t border-[#E8D5B7]/60">
          Your collection address will be shared about 2 hours before your slot, after payment is confirmed.
        </p>
      </SHCCard>

      <SHCSectionTitle subtitle="Message your cook about dietary needs or arrival time">Chat</SHCSectionTitle>
      <div className="border border-[#E8D5B7] bg-white rounded-xl overflow-hidden">
        <div className="h-56 overflow-y-auto p-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <p className="text-[#5C5144] text-center py-8">No messages yet. Say hello to your cook.</p>
          )}
          {messages.map((m: { sender_actor?: string; body?: string }, i: number) => (
            <div
              key={i}
              className={`max-w-[85%] p-3 rounded-lg ${
                m.sender_actor === 'cook'
                  ? 'bg-[#F5F0E6] text-[#2C2416] mr-auto'
                  : 'bg-[#1D9E75] text-white ml-auto'
              }`}
            >
              {m.body}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3 border-t border-[#E8D5B7] bg-[#FAF7F2]">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="shc-input flex-1 py-2"
            placeholder="Type a message…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) {
                send({ body: msg, from: 'customer' });
                setMsg('');
              }
            }}
          />
          <SHCButton
            size="sm"
            onClick={() => {
              if (msg.trim()) {
                send({ body: msg, from: 'customer' });
                setMsg('');
              }
            }}
          >
            Send
          </SHCButton>
        </div>
      </div>


    </div>
  );
}