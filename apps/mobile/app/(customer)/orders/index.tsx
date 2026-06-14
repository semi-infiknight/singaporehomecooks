// apps/mobile/app/(customer)/orders/index.tsx
// Customer orders list + profile stub. Links to detail + chat.
import React from 'react';
import { Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { SHCCard, OrderStatusBadge, shcColors } from '@shc/ui';
import { useMyOrders } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';

export default function MyOrdersList() {
  const { data: orders = [] } = useMyOrders('customer');
  const { user } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>My Orders • {user.name}</Text>
      {orders.length === 0 && <SHCCard><Text>No orders yet. Discover dishes for your next occasion.</Text></SHCCard>}
      {orders.map((o: any) => (
        <Link key={o.id} href={`/(customer)/orders/${o.id}` as any} asChild>
          <SHCCard style={{ marginBottom: 8 }}>
            <Text>{o.id} • {o.items?.[0]?.name}</Text>
            <OrderStatusBadge status={o.shc_status} />
            <Text style={{ fontSize: 12 }}>{o.collection_date} {o.collection_slot} • S${o.total}</Text>
            <Text style={{ color: shcColors.primary, marginTop: 4 }}>Tap to track or chat →</Text>
          </SHCCard>
        </Link>
      ))}
      <Link href="/(customer)/cart" asChild><Text style={{ marginTop: 12, color: shcColors.primary }}>Back to cart / discover</Text></Link>
    </ScrollView>
  );
}