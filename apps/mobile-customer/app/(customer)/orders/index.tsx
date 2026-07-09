/**
 * My Orders — HomelyEats day calendar + status card variants.
 * One-time orders + tiffin meal instances per collection date.
 */
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GourmeatScreenHeader,
  GourmeatEmptyState,
  GourmeatCard,
  SHCTiffinCalendarStrip,
  SHCTiffinOrderStatusCard,
  gourmeatColors,
  shcSpacing,
  DirectionalTabScreen,
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
  type DayOrderCard,
} from '@shc/utils';
import { useMyOrders } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal } from '../../../hooks/useTiffin';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';

export default function MyOrdersList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const todayRef = useRef(toIsoDate(new Date()));
  const today = todayRef.current;
  const from = addDaysIso(weekStartMonday(), -7);
  const to = addDaysIso(weekStartMonday(), 21);

  const { data: orders = [], isFetching } = useMyOrders('customer');
  const { data: mealData, isLoading: mealsLoading } = useTiffinMealOrders(from, to);
  const { data: subData } = useTiffinSubscription();
  const skipMut = useSkipTiffinMeal();

  const kitchen = (subData as any)?.kitchen || (subData as any)?.subscription;
  const cookName =
    kitchen?.cook?.display_name || kitchen?.cook_name || kitchen?.display_name || 'Tiffin kitchen';
  const dishes = (kitchen?.dishes || []) as Array<{ id: string; name: string }>;

  const allCards: DayOrderCard[] = useMemo(() => {
    const nowIso = today;
    const oneOff = (orders as Record<string, unknown>[]).map((o) => oneOffOrderToDayCard(o, nowIso));
    const meals = ((mealData as any)?.meals || []) as Record<string, unknown>[];
    const tiffin = meals.map((m) => {
      const pid = String(m.product_id || '');
      const dishName = dishes.find((d) => d.id === pid)?.name;
      return tiffinMealToDayCard(m, { cookName, dishName });
    });
    return mergeDayOrderCards(oneOff, tiffin);
  }, [orders, mealData, cookName, dishes, today]);

  const dateSet = useMemo(() => collectOrderDates(allCards), [allCards]);

  const calendarDays = useMemo(() => {
    return calendarRangeAround(today, 3, 14).map((d) => ({
      date: d.date,
      label: d.label,
      hasMeal: dateSet.has(d.date),
    }));
  }, [today, dateSet]);

  const [selected, setSelected] = useState(today);
  const userPickedRef = useRef(false);
  const didInitSelectRef = useRef(false);

  const selectDay = useCallback((date: string) => {
    userPickedRef.current = true;
    setSelected(date);
  }, []);

  // Initial auto-select only — never snap back after user taps a day
  useEffect(() => {
    if (userPickedRef.current || didInitSelectRef.current) return;
    if (mealsLoading) return;
    didInitSelectRef.current = true;
    if (dateSet.has(today)) {
      setSelected(today);
      return;
    }
    const next = calendarDays.find((d) => d.hasMeal);
    if (next) setSelected(next.date);
  }, [dateSet, today, calendarDays, mealsLoading]);

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

  return (
    <DirectionalTabScreen testID="orders-tab-scene">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + shcSpacing.md, paddingBottom: 120 },
        ]}
        testID="customer-orders-screen"
      >
        <GourmeatScreenHeader
          title="My orders"
          subtitle={`${monthLabelForDate(selected)}${isFetching || mealsLoading ? ' · updating…' : ''}`}
        />

        {!user ? (
          <GourmeatCard>
            <GourmeatEmptyState
              title="Sign in to see orders"
              body="Scheduled collections and tiffin meals appear here by day."
              ctaLabel="Sign in"
              onCta={() => router.push('/(shared)/auth' as any)}
            />
          </GourmeatCard>
        ) : (
          <>
            <SHCTiffinCalendarStrip
              days={calendarDays}
              selectedDate={selected}
              onSelect={selectDay}
              testID="orders-calendar-strip"
            />

            <Text style={styles.dayHeading} testID="orders-selected-date">
              {selected === today ? 'Today' : selected}
            </Text>

            {mealsLoading && dayCards.length === 0 ? (
              <ActivityIndicator color={gourmeatColors.primary} style={{ marginVertical: 24 }} />
            ) : null}

            {dayCards.length === 0 && !mealsLoading ? (
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
        )}
      </ScrollView>
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
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
});
