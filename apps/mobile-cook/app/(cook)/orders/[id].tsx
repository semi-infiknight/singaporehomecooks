// apps/mobile/app/(cook)/orders/[id].tsx
// Cook manage single order detail + action buttons (state machine).
import React from 'react';
import { Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SHCCard, OrderStatusBadge, shcColors } from '@shc/ui';
import { useOrder, useTransitionOrder } from '../../../hooks/useOrder';

export default function CookManageOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order } = useOrder(id || '');
  const trans = useTransitionOrder();

  if (!order) return <Text style={{ padding: 16 }}>Loading order...</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Manage {order.id}</Text>
      <OrderStatusBadge status={order.shc_status} />
      <SHCCard style={{ marginTop: 12 }}>
        <Text>Collection {order.collection_date} {order.collection_slot}</Text>
        <Text>Total S${order.total} for {order.items?.length || 1} items</Text>
        <Text style={{ marginTop: 8 }}>Customer notes: Address in chat after accept. Use buttons in /orders list for transitions.</Text>
      </SHCCard>
      <Text style={{ fontSize: 11, marginTop: 12, color: shcColors.textLight }}>Valid transitions only (see 09-order-state.md). Invalid shows SHC-ORDER-001 error.</Text>
    </ScrollView>
  );
}