'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { buildOrderChatContext, getOrderStatusLabel, ORDER_COLLECTION_PRIVACY_HINT } from '@shc/utils';
import { useOrder, useChat } from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import { GourmeatScreenHeader, SHCSkeletonList } from '../../components/SHCWebComponents';
import { SHCOrderChatPanel } from '../../components/SHCOrderChat';

export default function OrderChatPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = String(params?.orderId || '');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: orderRaw, isLoading: orderLoading } = useOrder(orderId);
  const { messages, send } = useChat(orderId);
  const [sending, setSending] = useState(false);

  const order = orderRaw as Record<string, unknown> | undefined;
  const chatContext = useMemo(() => {
    if (!order) return null;
    const base = buildOrderChatContext({
      orderId,
      status: String(order.shc_status || ''),
      statusLabel: getOrderStatusLabel(String(order.shc_status || '')),
      counterpartyName: String(order.cook_name || 'Your cook'),
      collectionDate: order.collection_date ? String(order.collection_date) : undefined,
      collectionSlot: order.collection_slot ? String(order.collection_slot) : undefined,
      collectionAddress: order.collection_address ? String(order.collection_address) : undefined,
      collectionInstructions: order.collection_instructions
        ? String(order.collection_instructions)
        : undefined,
      items: (order.items as Array<{ name?: string }>) || [],
    });
    return {
      ...base,
      privacyHint: order.collection_address_released ? undefined : ORDER_COLLECTION_PRIVACY_HINT,
    };
  }, [order, orderId]);

  const handleSend = (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    send(
      { body: body.trim(), from: 'customer' },
      {
        onSettled: () => setSending(false),
      }
    );
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="order-chat-loading">
        <SHCSkeletonList count={3} rowHeight={64} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 shc-tab-bar-pad" data-testid="order-chat-auth-gate">
        <GourmeatScreenHeader title="Order chat" subtitle="Sign in to message your cook" />
        <button
          type="button"
          className="mt-4 text-sm font-bold text-primary underline"
          onClick={() => router.push(`/login?next=${encodeURIComponent(`/chat/${orderId}`)}`)}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad md:pb-8" data-testid="order-chat-screen">
      <GourmeatScreenHeader
        title="Order chat"
        subtitle={chatContext?.counterpartyName || 'Your cook'}
        backHref={`/orders/${orderId}`}
      />
      {orderLoading || !chatContext ? (
        <SHCSkeletonList count={4} rowHeight={72} />
      ) : (
        <SHCOrderChatPanel
          viewerRole="customer"
          context={chatContext}
          messages={messages}
          onSend={handleSend}
          sending={sending}
          isLoading={orderLoading}
        />
      )}
    </div>
  );
}
