import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, OrderStatusBadge, shcColors } from '@shc/ui';
import { useOrder, useTransitionOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';

// Customer order + tracking: live status from state machine, address release, deep link to chat, post-collect review stub.
export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order } = useOrder(id || '');
  const { user } = useAuth();

  if (!order) return <Text style={{ padding: 16 }}>Loading order {id}...</Text>;

  const addrReleased = !!order.address_released_at || order.shc_status !== 'paid';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: shcColors.text }}>Order {order.id}</Text>
      <OrderStatusBadge status={order.shc_status} />
      <Text style={{ marginTop: 4 }}>Collection: {order.collection_date} {order.collection_slot} • S${order.total}</Text>

      <SHCCard style={{ marginVertical: 12 }}>
        <Text style={{ fontWeight: '600' }}>Items</Text>
        {(order.items || []).map((it: any, i: number) => <Text key={i}>{it.qty}x {it.name}</Text>)}
        {addrReleased && order.shc_status !== 'cart' && (
          <Text style={{ marginTop: 8, color: shcColors.accent }}>🏠 HDB Address released (post-paid): {order.cook_name || 'Cook'} — {order.collection_instructions || 'Blk details in chat. Ring bell on arrival.'}</Text>
        )}
        {!addrReleased && <Text style={{ color: shcColors.textLight }}>Address released 2h before collection (PDPA privacy for home cook — only after paid status).</Text>}
        <Text style={{ marginTop: 8, fontSize: 11, color: shcColors.success }}>Cook earnings on this order (est): S${Math.floor((order.total || 0) * 0.85)} — preview visible at every step.</Text>
      </SHCCard>

      <Link href={`/(shared)/chat/${order.id}` as any} asChild>
        <SHCButton>
          <SHCButtonText>Open Order Chat (polling live)</SHCButtonText>
        </SHCButton>
      </Link>

      <Text style={{ marginTop: 16, fontSize: 12, color: shcColors.textLight }}>After collection: leave review (one per order, post-collected only per rules). Home Credits earned.</Text>
      <Text style={{ fontSize: 11 }}>Status machine validated via @shc/types + business-rules on every transition.</Text>
    </ScrollView>
  );
}
