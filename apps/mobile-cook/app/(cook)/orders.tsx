/**
 * Cook Orders — active collections + Collaboration Board (recipe request bids).
 * Bids live here (not dashboard) so cooks work requests next to order ops.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatActionRow,
  GourmeatCard,
  GourmeatEmptyState,
  SHCErrorBanner,
  SHCFadeIn,
  SHCBadge,
  SHCSectionTitle,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { getOrderStatusLabel, parseBidDollarsToCents, formatBidCentsAsDollars } from '@shc/utils';

import { useMyOrders, useTransitionOrder, useRequests, useCreateBid } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { SHCOrderStatus } from '@shc/types';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept' }],
  accepted: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: orders = [] } = useMyOrders();
  const { data: openReqs = [] } = useRequests();
  const createBidMut = useCreateBid();
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);
  const [bidPrices, setBidPrices] = useState<Record<string, string>>({});
  const [bidMessages, setBidMessages] = useState<Record<string, string>>({});
  const [bidSuccess, setBidSuccess] = useState<Record<string, string>>({});
  const [bidError, setBidError] = useState('');
  const [biddingId, setBiddingId] = useState<string | null>(null);

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    setErr(null);
    try {
      await transMut.mutateAsync({ orderId, to });
    } catch (e: any) {
      setErr({ message: e?.message || 'Transition failed' });
    }
  };

  const handleBid = async (reqId: string) => {
    setBidError('');
    setBidSuccess((s) => {
      const next = { ...s };
      delete next[reqId];
      return next;
    });
    const parsed = parseBidDollarsToCents(bidPrices[reqId]);
    if (!parsed.ok) {
      setBidError(parsed.message);
      return;
    }
    setBiddingId(reqId);
    try {
      await createBidMut.mutateAsync({
        requestId: reqId,
        priceCents: parsed.cents,
        message:
          bidMessages[reqId]?.trim() ||
          'Heritage HDB recipe interpretation ready. Flexible for your party size.',
      });
      setBidSuccess((s) => ({
        ...s,
        [reqId]: `Bid sent · ${formatBidCentsAsDollars(parsed.cents)}`,
      }));
      setBidPrices((p) => ({ ...p, [reqId]: '' }));
    } catch (e: any) {
      setBidError(e?.message || 'Could not place bid. Check login and try again.');
    } finally {
      setBiddingId(null);
    }
  };

  const pendingCount = orders.filter((o: any) => !['collected', 'completed'].includes(o.shc_status)).length;
  const reqList = Array.isArray(openReqs) ? openReqs : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-orders-screen"
    >
      <GourmeatCookHeader
        title="Orders"
        subtitle={user?.name}
        badges={
          pendingCount > 0 ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: gourmeatColors.primary,
                backgroundColor: gourmeatColors.primaryLight,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              {pendingCount} active
            </Text>
          ) : undefined
        }
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      <SHCSectionTitle>Collection orders</SHCSectionTitle>

      {orders.length === 0 && (
        <GourmeatCard>
          <GourmeatEmptyState title="No orders yet" body="New collection orders will appear here." />
        </GourmeatCard>
      )}

      <SHCFadeIn delay={80}>
        {orders.map((o: any) => {
          const actions = NEXT_ACTIONS[o.shc_status] || [];
          const dishName = o.items?.[0]?.name;
          return (
            <GourmeatOrderRow
              key={o.id}
              orderId={o.id}
              dishName={dishName}
              productId={o.items?.[0]?.product_id}
              status={o.shc_status}
              statusLabel={getOrderStatusLabel(String(o.shc_status || ''))}
              collectionDate={o.collection_date}
              collectionSlot={o.collection_slot}
              total={o.total}
              onPress={() => router.push(`/(cook)/orders/${o.id}` as any)}
              testID={`cook-order-row-${o.id}`}
              actions={
                <GourmeatActionRow testID={`cook-order-actions-${o.id}`}>
                  {actions.map((a) => (
                    <GourmeatPrimaryButton
                      key={a.to}
                      label={a.label}
                      size="sm"
                      testID={`cook-order-${o.id}-action-${a.to}`}
                      onPress={() => doTransition(o.id, a.to)}
                    />
                  ))}
                  <GourmeatPrimaryButton
                    label="Chat"
                    size="sm"
                    variant="outline"
                    testID={`cook-order-${o.id}-chat`}
                    onPress={() => router.push(`/(shared)/chat/${o.id}` as any)}
                  />
                  <GourmeatPrimaryButton
                    label="Details"
                    size="sm"
                    variant="outline"
                    testID={`cook-order-${o.id}-details`}
                    onPress={() => router.push(`/(cook)/orders/${o.id}` as any)}
                  />
                </GourmeatActionRow>
              }
            />
          );
        })}
      </SHCFadeIn>

      {/* Collaboration Board — below collection orders */}
      <View style={[styles.collabHeader, { marginTop: shcSpacing.lg }]} testID="cook-collab-board">
        <SHCSectionTitle style={styles.collabTitle}>Collaboration Board</SHCSectionTitle>
        {reqList.length > 0 ? <SHCBadge variant="warning">{reqList.length} open</SHCBadge> : null}
      </View>
      <Text style={styles.collabHint}>
        Customer recipe requests. Bid in S$ — winning bid creates an order you fulfil like any other.
      </Text>
      {bidError ? (
        <Text style={styles.bidError} testID="collab-bid-error">
          {bidError}
        </Text>
      ) : null}
      <GourmeatCard testID="cook-collab-card">
        {reqList.length === 0 ? (
          <GourmeatEmptyState
            title="No open requests"
            body="When customers post custom dish requests, they appear here for bidding."
          />
        ) : (
          reqList.map((r: any) => (
            <View key={r.id} style={styles.collabItem} testID={`collab-req-${r.id}`}>
              <Text style={styles.collabBody} numberOfLines={3}>
                {r.body || r.title || 'Custom request'}
              </Text>
              <View style={styles.collabBadges}>
                <SHCBadge variant="heritage">{r.party_size || '?'} guests</SHCBadge>
                <SHCBadge variant="default">
                  Budget S${r.budget_cents != null ? (Number(r.budget_cents) / 100).toFixed(0) : '—'}
                </SHCBadge>
                {r.date ? <SHCBadge variant="default">{r.date}</SHCBadge> : null}
              </View>
              <TextInput
                placeholder="Your bid in S$ (e.g. 14)"
                placeholderTextColor={gourmeatColors.textLight}
                value={bidPrices[r.id] || ''}
                onChangeText={(t) => setBidPrices((p) => ({ ...p, [r.id]: t }))}
                keyboardType="decimal-pad"
                style={styles.collabInput}
                testID={`bid-price-${r.id}`}
              />
              <TextInput
                placeholder="Message (optional)"
                placeholderTextColor={gourmeatColors.textLight}
                value={bidMessages[r.id] || ''}
                onChangeText={(t) => setBidMessages((p) => ({ ...p, [r.id]: t }))}
                style={styles.collabInput}
                testID={`bid-msg-${r.id}`}
              />
              {bidSuccess[r.id] ? (
                <Text style={styles.bidOk} testID={`bid-success-${r.id}`}>
                  {bidSuccess[r.id]}
                </Text>
              ) : null}
              <GourmeatPrimaryButton
                label={biddingId === r.id ? 'Sending…' : 'Place bid'}
                onPress={() => handleBid(r.id)}
                loading={biddingId === r.id}
                testID={`bid-btn-${r.id}`}
                style={{ marginTop: 4 }}
              />
            </View>
          ))
        )}
      </GourmeatCard>

      <Link href="/(cook)/listings" asChild>
        <Pressable style={styles.listingsBtn}>
          <Text style={styles.listingsBtnText}>Manage listings →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  collabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  collabTitle: { marginBottom: 0 },
  collabHint: {
    fontSize: 12,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    marginBottom: shcSpacing.sm,
  },
  collabItem: {
    marginBottom: shcSpacing.md,
    paddingBottom: shcSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
  },
  collabBody: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
  collabBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 },
  collabInput: {
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: gourmeatColors.text,
    backgroundColor: gourmeatColors.surface,
    marginBottom: 8,
  },
  bidError: { fontSize: 13, fontWeight: '700', color: '#b91c1c', marginBottom: 8 },
  bidOk: { fontSize: 13, fontWeight: '700', color: '#15803d', marginBottom: 6 },
  listingsBtn: {
    marginTop: shcSpacing.md,
    backgroundColor: gourmeatColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  listingsBtnText: { color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 15 },
});
