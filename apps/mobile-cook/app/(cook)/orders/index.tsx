// apps/mobile/app/(cook)/orders/index.tsx
// Cook orders management: list + Accept/Prepare/Ready/Collected buttons that call transition logic (validate order-state rule + SHCErrorCode).
// Full fulfilment flow.
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, OrderStatusBadge, SHCErrorBanner, shcColors } from '@shc/ui';
import { useMyOrders, useTransitionOrder, useOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { SHCOrderStatus } from '@shc/types';

const nextActions: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept Order' }],
  accepted: [{ to: 'preparing', label: 'Start Preparing' }],
  preparing: [{ to: 'ready_for_collection', label: 'Mark Ready for Collection' }],
  ready_for_collection: [{ to: 'collected', label: 'Mark Collected' }],
};

export default function CookOrders() {
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders();
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    setErr(null);
    const res = await transMut.mutateAsync({ orderId, to });
    if (res?.error) setErr(res.error);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Cook Orders • {user?.name}</Text>
      <Text style={{ color: shcColors.textLight }}>Transitions validated with order-state machine. Compliance stub checked on accept.</Text>

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      {orders.length === 0 && <SHCCard><Text>No orders yet. Publish listings to receive.</Text></SHCCard>}

      {orders.map((o: any) => {
        const actions = nextActions[o.shc_status] || [];
        return (
          <SHCCard key={o.id} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: '600' }}>{o.id} • {o.items?.[0]?.name} x{o.items?.[0]?.qty}</Text>
            <Text>{o.collection_date} {o.collection_slot} • S${o.total} • {o.customer_id}</Text>
            <OrderStatusBadge status={o.shc_status} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {actions.map((a, idx) => (
                <SHCButton key={idx} size="sm" onPress={() => doTransition(o.id, a.to)}>
                  <SHCButtonText>{a.label}</SHCButtonText>
                </SHCButton>
              ))}
              <Link href={`/(shared)/chat/${o.id}` as any} asChild>
                <SHCButton size="sm" variant="outline"><SHCButtonText>Chat</SHCButtonText></SHCButton>
              </Link>
              <Link href={`/(cook)/orders/${o.id}` as any} asChild>
                <SHCButton size="sm" variant="outline"><SHCButtonText>Details</SHCButtonText></SHCButton>
              </Link>
            </View>
          </SHCCard>
        );
      })}

      <Link href="/(cook)/listings" asChild><SHCButton style={{ marginTop: 16 }}><SHCButtonText>Manage Listings</SHCButtonText></SHCButton></Link>
    </ScrollView>
  );
}