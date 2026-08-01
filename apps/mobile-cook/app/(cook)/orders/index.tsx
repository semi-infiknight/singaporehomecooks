/**
 * Cook Orders — collection calendar + order ops only (custom requests live under Home).
 */
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
  SHCSectionTitle,
  SHCSkeletonOrderList,
  SHCTiffinCalendarStrip,
  gourmeatColors,
  shcSpacing,
  contentPadForTabBar,
} from '@shc/ui';
import {
  getOrderStatusLabel,
  isCookComplianceVerified,
  partitionCookOrders,
  todayIsoInSingapore,
  monthLabelForDate,
  collectCookOrderDates,
  buildCookCalendarDays,
  filterCookOrdersByDate,
  emptyCookOrdersDayCopy,
} from '@shc/utils';

import { useMyOrders, useTransitionOrder, useComplianceDocs } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { SHCOrderStatus } from '@shc/types';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  cart: [{ to: 'accepted', label: 'Accept' }, { to: 'cancelled', label: 'Decline' }],
  paid: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: orders, isLoading: ordersLoading, isError: ordersError, error: ordersErr, refetch: refetchOrders } = useMyOrders();
  const orderList = (orders as any[]) ?? [];
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);

  const todayRef = useRef(todayIsoInSingapore());
  const today = todayRef.current;
  const [selected, setSelected] = useState(today);

  const selectDay = useCallback((date: string) => {
    setSelected(date);
  }, []);

  useEffect(() => {
    setSelected(today);
  }, [today]);

  const orderDates = useMemo(() => collectCookOrderDates(orderList), [orderList]);
  const calendarDays = useMemo(() => buildCookCalendarDays(today, orderDates), [today, orderDates]);
  const dayOrders = useMemo(
    () => filterCookOrdersByDate(orderList, selected, today),
    [orderList, selected, today]
  );
  const { needsAction: allNeedsAction, inProgress: allInProgress } = partitionCookOrders(orderList);
  const { needsAction, inProgress } = partitionCookOrders(dayOrders);

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    setErr(null);
    if (to === 'accepted' && !complianceOk) {
      setErr({
        code: 'SHC-COMPLIANCE-002',
        message: 'SFA and WSQ must be verified before you can accept orders. Upload certificates in Compliance.',
      });
      return;
    }
    try {
      await transMut.mutateAsync({ orderId, to });
    } catch (e: any) {
      setErr({ code: e?.code, message: e?.message || 'Transition failed' });
    }
  };

  const dayEmpty = needsAction.length === 0 && inProgress.length === 0;

  const renderOrderRow = (o: any) => {
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
        onPress={() => router.push(`/(cook)/orders/${encodeURIComponent(String(o.id))}` as any)}
        testID={`cook-order-row-${o.id}`}
        actions={
          <GourmeatActionRow testID={`cook-order-actions-${o.id}`}>
            {actions.map((a) => (
              <GourmeatPrimaryButton
                key={a.to}
                label={a.label}
                size="sm"
                testID={`cook-order-${o.id}-action-${a.to}`}
                disabled={a.to === 'accepted' && !complianceOk}
                onPress={() => doTransition(o.id, a.to)}
              />
            ))}
            <GourmeatPrimaryButton
              label="Chat"
              size="sm"
              variant="outline"
              testID={`cook-order-${o.id}-chat`}
              onPress={() => router.push(`/(shared)/chat/${encodeURIComponent(String(o.id))}` as any)}
            />
            <GourmeatPrimaryButton
              label="Details"
              size="sm"
              variant="outline"
              testID={`cook-order-${o.id}-details`}
              onPress={() => router.push(`/(cook)/orders/${encodeURIComponent(String(o.id))}` as any)}
            />
          </GourmeatActionRow>
        }
      />
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
      testID="cook-orders-screen"
    >
      <GourmeatCookHeader
        title="Orders"
        subtitle={[user?.name, monthLabelForDate(selected)].filter(Boolean).join(' · ')}
        badges={
          allNeedsAction.length > 0 ? (
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
              {allNeedsAction.length} need action
            </Text>
          ) : allInProgress.length > 0 ? (
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: gourmeatColors.textLight,
                backgroundColor: gourmeatColors.surface,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              {allInProgress.length} in progress
            </Text>
          ) : undefined
        }
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}
      {ordersError && (
        <SHCErrorBanner
          message={(ordersErr as Error)?.message || 'Could not load orders. Pull to retry or check login.'}
        />
      )}

      {!complianceOk && allNeedsAction.length > 0 && (
        <GourmeatCard style={{ marginBottom: shcSpacing.sm, backgroundColor: '#FEF3C7' }} testID="cook-compliance-gate-banner">
          <Text style={{ fontSize: 13, fontWeight: '700', color: gourmeatColors.text }}>
            Upload SFA + WSQ and wait for ops verification before accepting orders.
          </Text>
          <GourmeatPrimaryButton
            label="Go to Compliance"
            size="sm"
            variant="outline"
            onPress={() => router.push('/(cook)/compliance' as any)}
            style={{ marginTop: 8 }}
            testID="cook-compliance-gate-cta"
          />
        </GourmeatCard>
      )}

      <SHCTiffinCalendarStrip
        days={calendarDays}
        selectedDate={selected}
        todayDate={today}
        onSelect={selectDay}
        testID="cook-orders-calendar-strip"
      />

      <Text style={styles.dayHeading} testID="cook-orders-selected-date">
        {selected === today ? 'Today' : selected}
      </Text>

      {needsAction.length > 0 && (
        <>
          <View testID="cook-orders-needs-action">
            <SHCSectionTitle>Needs action</SHCSectionTitle>
          </View>
          <SHCFadeIn delay={40}>{needsAction.map(renderOrderRow)}</SHCFadeIn>
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <View testID="cook-orders-in-progress">
            <SHCSectionTitle>In progress</SHCSectionTitle>
          </View>
          <SHCFadeIn delay={80}>{inProgress.map(renderOrderRow)}</SHCFadeIn>
        </>
      )}

      {dayEmpty && (
        <>
          {ordersLoading && orderList.length === 0 && (
            <SHCSkeletonOrderList count={4} variant="row" />
          )}

          {!ordersLoading && !ordersError && (
            <GourmeatCard testID="cook-orders-day-empty">
              <GourmeatEmptyState
                title={emptyCookOrdersDayCopy({ isToday: selected === today }).title}
                body={emptyCookOrdersDayCopy({ isToday: selected === today }).body}
              />
            </GourmeatCard>
          )}

          {ordersError && orderList.length === 0 && (
            <GourmeatPrimaryButton label="Retry load orders" onPress={() => void refetchOrders()} style={{ marginBottom: 12 }} />
          )}
        </>
      )}

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
  dayHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: gourmeatColors.text,
    marginBottom: shcSpacing.sm,
  },
  listingsBtn: {
    marginTop: shcSpacing.md,
    backgroundColor: gourmeatColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  listingsBtnText: { color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 15 },
});
