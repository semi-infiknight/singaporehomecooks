import React, { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SHCOrderChatPane } from '@shc/ui';
import { buildOrderChatContext, cookChatQuickReplies, getOrderStatusLabel } from '@shc/utils';
import { useOrder, useOrderChat } from '../../../../hooks/useOrder';
import { useAuth } from '../../../../hooks/useAuth';
import { useCookConfig } from '../../../../hooks/useCookConfig';

export default function OrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = orderId || '';
  const { data: orderRaw, isLoading: orderLoading } = useOrder(id);
  const { messages, send, isLoading: chatLoading } = useOrderChat(id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  useAuth();
  const { config } = useCookConfig();

  const order = orderRaw as Record<string, unknown> | undefined;
  const context = useMemo(() => {
    const base = buildOrderChatContext({
      orderId: id,
      status: String(order?.shc_status || ''),
      statusLabel: getOrderStatusLabel(String(order?.shc_status || '')),
      counterpartyName: 'Customer',
      collectionDate: order?.collection_date ? String(order.collection_date) : undefined,
      collectionSlot: order?.collection_slot ? String(order.collection_slot) : undefined,
      collectionInstructions: order?.collection_instructions ? String(order.collection_instructions) : undefined,
      items: (order?.items as Array<{ name?: string }>) || [],
    });
    return {
      ...base,
      privacyHint: 'Share HDB block / unit in chat when the order is ready for collection.',
    };
  }, [id, order]);

  const handleSend = (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    send(
      { body: body.trim(), from: 'cook' },
      {
        onSettled: () => setSending(false),
      } as any
    );
  };

  return (
    <SHCOrderChatPane
      viewerRole="cook"
      context={context}
      messages={messages}
      draft={draft}
      onDraftChange={setDraft}
      onSend={handleSend}
      sending={sending}
      isLoading={orderLoading || chatLoading}
      quickReplies={cookChatQuickReplies('cook', config)}
    />
  );
}
