/**
 * My Orders — HomelyEats day calendar + status card variants.
 * One-time orders + tiffin meal instances per collection date.
 */
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  GourmeatScreenHeader,
  GourmeatEmptyState,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCTiffinCalendarStrip,
  SHCTiffinOrderStatusCard,
  SHCSkeletonOrderList,
  SHCSkeletonOrdersDayScreen,
  SHCAuthSessionGate,
  gourmeatColors,
  shcSpacing,
  DirectionalTabScreen,
  contentPadForTabBar,
  SHCCustomRequestCard,
} from '@shc/ui';
import {
  toIsoDate,
  calendarRangeAround,
  oneOffOrderToDayCard,
  tiffinMealToDayCard,
  mergeDayOrderCards,
  cardsForDate,
  collectOrderDates,
  monthLabelForDate,
  buildManageOrderQuery,
  emptyOrdersDayCopy,
  primaryActionLabel,
  type DayOrderCard,
  CUSTOM_REQUEST_COPY,
} from '@shc/utils';
import { useMyOrders, useMyRequests } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { getCorporateInvoicesDownloadUrl } from '../../../lib/api-client';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal } from '../../../hooks/useTiffin';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';

export default function MyOrdersList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const todayRef = useRef(toIsoDate(new Date()));
  const today = todayRef.current;
  const from = addDaysIso(weekStartMonday(), -7);
  const to = addDaysIso(weekStartMonday(), 21);

  const { data: orders, isLoading: ordersLoading, isFetching } = useMyOrders('customer');
  const { data: myRequests = [] } = useMyRequests({ enabled: !!user });
  const activeRequests = (myRequests as any[]).filter((r) => r.status === 'open' || r.status === 'bidding');
  const orderList = (orders as Record<string, unknown>[]) ?? [];
  const [corpZipBusy, setCorpZipBusy] = useState(false);
  const hasCorporatePaid = useMemo(
    () =>
      orderList.some((o) => {
        if (!o.is_corporate) return false;
        const st = String(o.shc_status || '');
        return ['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'].includes(st);
      }),
    [orderList]
  );
  const { data: mealData, isLoading: mealsLoading } = useTiffinMealOrders(from, to);
  const { data: subData } = useTiffinSubscription();
  const skipMut = useSkipTiffinMeal();

  const kitchen = (subData as any)?.kitchen || (subData as any)?.subscription;
  const cookName =
    kitchen?.cook?.display_name || kitchen?.cook_name || kitchen?.display_name || 'Tiffin kitchen';
  const dishes = (kitchen?.dishes || []) as Array<{ id: string; name: string }>;

  const allCards: DayOrderCard[] = useMemo(() => {
    const nowIso = today;
    const oneOff = orderList.map((o) => oneOffOrderToDayCard(o, nowIso));
    const meals = ((mealData as any)?.meals || []) as Record<string, unknown>[];
    const tiffin = meals.map((m) => {
      const pid = String(m.product_id || '');
      const dishName = dishes.find((d) => d.id === pid)?.name;
      return tiffinMealToDayCard(m, { cookName, dishName });
    });
    return mergeDayOrderCards(oneOff, tiffin);
  }, [orderList, mealData, cookName, dishes, today]);

  const dateSet = useMemo(() => collectOrderDates(allCards), [allCards]);

  const calendarDays = useMemo(() => {
    return calendarRangeAround(today, 3, 14).map((d) => ({
      date: d.date,
      label: d.label,
      hasMeal: dateSet.has(d.date),
    }));
  }, [today, dateSet]);

  const [selected, setSelected] = useState(today);

  const selectDay = useCallback((date: string) => {
    setSelected(date);
  }, []);

  // Always land on today when opening the Orders tab
  useFocusEffect(
    useCallback(() => {
      setSelected(today);
    }, [today])
  );

  const ordersPending = ordersLoading || mealsLoading;

  const dayCards = useMemo(() => cardsForDate(allCards, selected), [allCards, selected]);

  const onManage = (card: DayOrderCard) => {
    if (card.status === 'scheduled' || card.status === 'indeterminate') {
      router.push(`/(customer)/orders/manage?${buildManageOrderQuery(card)}` as any);
      return;
    }
    if (card.managePath === 'tiffin') {
      router.push('/(customer)/tiffin/manage' as any);
      return;
    }
    if (card.hrefOrderId) {
      router.push(`/(customer)/orders/${card.hrefOrderId}` as any);
    }
  };

  const downloadCorporateZip = async () => {
    if (corpZipBusy) return;
    setCorpZipBusy(true);
    try {
      const res = await getCorporateInvoicesDownloadUrl({ from, to });
      if (!res.download_url) throw new Error('No download URL from server');
      await Linking.openURL(res.download_url);
    } catch (e: any) {
      Alert.alert('Corporate invoices', e?.message || 'Could not download corporate invoices ZIP.');
    } finally {
      setCorpZipBusy(false);
    }
  };

  return (
    <DirectionalTabScreen testID="orders-tab-scene">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
        ]}
        testID="customer-orders-screen"
      >
        <GourmeatScreenHeader
          title="My orders"
          subtitle={`${monthLabelForDate(selected)}${isFetching || mealsLoading || ordersLoading ? ' · updating…' : ''}`}
        />

        <SHCAuthSessionGate
          loading={authLoading}
          user={user}
          skeleton={<SHCSkeletonOrdersDayScreen />}
          guest={
            <GourmeatCard>
              <GourmeatEmptyState
                title="Sign in to see orders"
                body="Scheduled collections and tiffin meals appear here by day."
                ctaLabel="Sign in"
                onCta={() => router.push('/(shared)/auth' as any)}
              />
            </GourmeatCard>
          }
        >
          <>
            {activeRequests.length > 0 ? (
              <View style={styles.requestsSection} testID="custom-requests-section">
                <Text style={styles.requestsTitle}>{CUSTOM_REQUEST_COPY.customerSectionTitle}</Text>
                <Text style={styles.requestsHint}>{CUSTOM_REQUEST_COPY.customerSectionHint}</Text>
                {activeRequests.map((req: any) => (
                  <SHCCustomRequestCard
                    key={req.id}
                    request={req}
                    onPress={() => router.push(`/(customer)/requests/${req.id}` as any)}
                    testID={`custom-request-card-${req.id}`}
                  />
                ))}
              </View>
            ) : null}

            {hasCorporatePaid ? (
              <GourmeatCard style={styles.corpCard}>
                <Text style={styles.corpTitle}>Corporate invoices</Text>
                <Text style={styles.corpBody}>
                  Download paid corporate / group orders as a ZIP for finance.
                </Text>
                <GourmeatPrimaryButton
                  label={corpZipBusy ? 'Preparing ZIP…' : 'Download corporate invoices (ZIP)'}
                  variant="outline"
                  onPress={downloadCorporateZip}
                  disabled={corpZipBusy}
                  loading={corpZipBusy}
                  testID="corporate-invoices-zip-btn"
                />
              </GourmeatCard>
            ) : null}

            <SHCTiffinCalendarStrip
              days={calendarDays}
              selectedDate={selected}
              todayDate={today}
              onSelect={selectDay}
              testID="orders-calendar-strip"
            />

            <Text style={styles.dayHeading} testID="orders-selected-date">
              {selected === today ? 'Today' : selected}
            </Text>

            {ordersPending && dayCards.length === 0 ? (
              <SHCSkeletonOrderList count={3} variant="card" />
            ) : null}

            {dayCards.length === 0 && !ordersPending ? (
              <View testID="orders-day-empty">
                <GourmeatEmptyState
                  illustration="no_orders"
                  title={emptyOrdersDayCopy({ isToday: selected === today }).title}
                  ctaLabel="Browse kitchens"
                  onCta={() => router.push('/(customer)/' as any)}
                />
              </View>
            ) : (
              dayCards.map((card) => (
                <View key={card.id} style={styles.cardWrap}>
                  <SHCTiffinOrderStatusCard
                    cookName={card.cookName}
                    planTitle={card.planTitle}
                    status={card.status}
                    timeslot={card.timeslot}
                    menuLines={card.menuLines}
                    customizable={card.customizable && card.status === 'scheduled'}
                    menuPending={card.menuPending}
                    onManage={() => onManage(card)}
                    manageLabel={primaryActionLabel(card)}
                    onSkip={
                      card.kind === 'tiffin' && card.status === 'scheduled'
                        ? () => skipMut.mutate({ collectionDate: card.collectionDate })
                        : undefined
                    }
                    testID={`orders-day-card-${card.id}`}
                  />
                  {card.kind === 'one_off' && card.hrefOrderId ? (
                    <Pressable
                      onPress={() => router.push(`/(shared)/chat/${card.hrefOrderId}` as any)}
                      style={styles.chatLink}
                    >
                      <Text style={styles.chatLinkText}>Chat with cook</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}

            <Text style={styles.legend}>
              Each card is one meal collection. Tiffin plans create meals ahead of time. Statuses:
              Upcoming · Scheduled · Collected · Skipped · Canceled by kitchen.
            </Text>
          </>
        </SHCAuthSessionGate>
      </ScrollView>
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  corpCard: { marginBottom: shcSpacing.md },
  corpTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 },
  corpBody: {
    fontSize: 12,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    marginBottom: shcSpacing.sm,
    lineHeight: 17,
  },
  dayHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: gourmeatColors.text,
    marginTop: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  cardWrap: { marginBottom: shcSpacing.sm },
  chatLink: { marginTop: -4, marginBottom: shcSpacing.sm, paddingLeft: 4 },
  chatLinkText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.primary },
  legend: {
    fontSize: 11,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    lineHeight: 16,
    marginTop: shcSpacing.md,
  },
  requestsSection: { marginBottom: shcSpacing.md },
  requestsTitle: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  requestsHint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.sm, marginTop: 4 },
});
