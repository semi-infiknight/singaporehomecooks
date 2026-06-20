import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  OrderStatusBadge,
  SHCErrorBanner,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { getOrderStatusLabel } from '@shc/utils';
import { useOrder, useTransitionOrder } from '../../../hooks/useOrder';
import { SHCOrderStatus } from '@shc/types';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept' }],
  accepted: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookManageOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: order } = useOrder(id || '');
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);

  const doTransition = async (to: SHCOrderStatus) => {
    if (!id) return;
    setErr(null);
    try {
      await transMut.mutateAsync({ orderId: id, to });
    } catch (e: any) {
      setErr({ message: e?.message || 'Transition failed' });
    }
  };

  if (!order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: gourmeatColors.textLight }}>Loading order…</Text>
      </View>
    );
  }

  const actions = NEXT_ACTIONS[order.shc_status] || [];
  const dishName = order.items?.[0]?.name;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: 100 }}
      testID="cook-order-detail-screen"
    >
      <GourmeatScreenHeader
        title={dishName || `Order ${order.id}`}
        subtitle={getOrderStatusLabel(String(order.shc_status || ''))}
        onBack={() => router.back()}
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      <OrderStatusBadge status={order.shc_status} />

      <GourmeatCard>
        <Text style={styles.cardTitle}>Collection</Text>
        <Text style={styles.cardBody}>
          {order.collection_date} · {order.collection_slot}
        </Text>
        <Text style={styles.cardMeta}>S${order.total} · {order.items?.length || 1} item(s)</Text>
        {(order.items || []).map((it: any, i: number) => (
          <Text key={i} style={styles.itemLine}>
            {it.qty}× {it.name}
          </Text>
        ))}
        <Text style={styles.hint}>
          Customer address in chat after accept. Use the buttons below to advance fulfilment.
        </Text>
      </GourmeatCard>

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <GourmeatPrimaryButton
              key={a.to}
              label={transMut.isPending ? 'Updating…' : a.label}
              onPress={() => doTransition(a.to)}
              disabled={transMut.isPending}
              testID={`cook-order-transition-${a.to}`}
            />
          ))}
        </View>
      )}

      <GourmeatPrimaryButton
        label="Chat with customer"
        variant="outline"
        onPress={() => router.push(`/(shared)/chat/${order.id}` as any)}
        testID="cook-order-chat-btn"
      />

      <Text style={styles.footer}>Valid transitions only — invalid moves show SHC-ORDER-001.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight },
  itemLine: { marginTop: 4, fontSize: 13, color: gourmeatColors.text },
  hint: { marginTop: shcSpacing.sm, fontSize: 12, color: gourmeatColors.textLight, lineHeight: 18 },
  actions: { gap: 8, marginTop: shcSpacing.md, marginBottom: shcSpacing.sm },
  footer: { fontSize: 11, marginTop: shcSpacing.md, color: gourmeatColors.textMuted },
});