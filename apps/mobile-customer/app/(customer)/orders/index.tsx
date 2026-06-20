import React from 'react';
import { Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GourmeatScreenHeader,
  GourmeatOrderRow,
  GourmeatEmptyState,
  GourmeatCard,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { getActiveOrders, getOrderStatusLabel, isActiveOrderStatus } from '@shc/utils';
import { useMyOrders } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';

export default function MyOrdersList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: orders = [], isFetching } = useMyOrders('customer');
  const { user } = useAuth();
  const activeOrders = getActiveOrders(orders as Record<string, unknown>[]);
  const pastOrders = (orders as any[]).filter((o) => !isActiveOrderStatus(String(o.shc_status || '')));

  const orderActions = (orderId: string) => (
    <GourmeatPrimaryButton
      label="Chat with cook"
      onPress={() => router.push(`/(shared)/chat/${orderId}` as any)}
      testID={`order-chat-${orderId}`}
      style={{ marginTop: shcSpacing.xs }}
    />
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="customer-orders-screen"
    >
      <GourmeatScreenHeader
        title="My Orders"
        subtitle={`${user?.name || 'Guest'} · Track & chat${isFetching && activeOrders.length > 0 ? ' · updating…' : ''}`}
      />

      {activeOrders.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>In progress</Text>
          {activeOrders.map((o: any) => (
            <GourmeatOrderRow
              key={o.id}
              orderId={o.id}
              dishName={o.items?.[0]?.name}
              productId={o.items?.[0]?.product_id}
              status={o.shc_status}
              statusLabel={getOrderStatusLabel(String(o.shc_status || ''))}
              collectionDate={o.collection_date}
              collectionSlot={o.collection_slot}
              total={o.total}
              onPress={() => router.push(`/(customer)/orders/${o.id}` as any)}
              actions={orderActions(o.id)}
              testID={`active-order-row-${o.id}`}
            />
          ))}
        </>
      )}

      {orders.length === 0 && (
        <GourmeatCard>
          <GourmeatEmptyState
            title="No orders yet"
            body="Discover dishes for your next occasion."
            ctaLabel="Browse dishes"
            onCta={() => router.push('/(customer)/' as any)}
          />
        </GourmeatCard>
      )}

      {pastOrders.length > 0 && activeOrders.length > 0 && (
        <Text style={styles.sectionLabel}>Past orders</Text>
      )}

      {pastOrders.map((o: any) => (
        <GourmeatOrderRow
          key={o.id}
          orderId={o.id}
          dishName={o.items?.[0]?.name}
          productId={o.items?.[0]?.product_id}
          status={o.shc_status}
          statusLabel={getOrderStatusLabel(String(o.shc_status || ''))}
          collectionDate={o.collection_date}
          collectionSlot={o.collection_slot}
          total={o.total}
          onPress={() => router.push(`/(customer)/orders/${o.id}` as any)}
          actions={orderActions(o.id)}
          testID={`order-row-${o.id}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm, marginTop: shcSpacing.xs },
});