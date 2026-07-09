/**
 * My Subscriptions — HomelyEats Active / Past tabs + empty screens.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  GourmeatEmptyState,
  GourmeatPrimaryButton,
  GourmeatCard,
  gourmeatColors,
  shcSpacing,
  tiffinWeeklySubtotal,
} from '@shc/ui';
import { emptyActiveSubscriptionsCopy, emptyPastSubscriptionsCopy } from '@shc/utils';
import { useTiffinSubscription } from '../../../hooks/useTiffin';
import { useAuth } from '../../../hooks/useAuth';

type Tab = 'active' | 'past';

export default function MySubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: subData, isLoading } = useTiffinSubscription();
  const [tab, setTab] = useState<Tab>('active');

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const status = String(sub?.status || '');
  const isActive = sub && status !== 'cancelled' && status !== 'canceled';
  const isPast = sub && (status === 'cancelled' || status === 'canceled');

  const activeCopy = emptyActiveSubscriptionsCopy();
  const pastCopy = emptyPastSubscriptionsCopy();

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.sm,
        paddingBottom: 120,
        flexGrow: 1,
      }}
      testID="my-subscriptions-screen"
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="subscriptions-back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabs} testID="subscriptions-tabs">
        {(
          [
            { id: 'active' as const, label: 'Active Subscriptions' },
            { id: 'past' as const, label: 'Past Subscriptions' },
          ] as const
        ).map((t) => {
          const on = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, on && styles.tabOn]}
              testID={`subscriptions-tab-${t.id}`}
            >
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!user ? (
        <GourmeatEmptyState
          illustration="no_active_sub"
          title="Sign in to manage subscriptions"
          ctaLabel="Sign in"
          onCta={() => router.push('/(shared)/auth' as any)}
          testID="subscriptions-guest-empty"
        />
      ) : tab === 'active' ? (
        isActive ? (
          <View style={styles.cardPad}>
            <GourmeatCard testID="subscription-active-card">
              <Text style={styles.kitchenName}>{kitchen?.cook?.display_name || 'Tiffin kitchen'}</Text>
              <Text style={styles.meta}>
                {sub.meals_per_week} meals/wk · S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}
                /wk · {status || 'active'}
              </Text>
              <GourmeatPrimaryButton
                label="Manage plan"
                onPress={() => router.push('/(customer)/tiffin/manage' as any)}
                testID="sub-manage-btn"
                style={{ marginTop: shcSpacing.md }}
              />
              <GourmeatPrimaryButton
                label="Meal calendar"
                variant="outline"
                onPress={() => router.push('/(customer)/tiffin/calendar' as any)}
                testID="sub-calendar-btn"
                style={{ marginTop: shcSpacing.sm }}
              />
            </GourmeatCard>
          </View>
        ) : (
          <GourmeatEmptyState
            illustration="no_active_sub"
            title={activeCopy.title}
            ctaLabel={activeCopy.ctaLabel}
            onCta={() => router.push('/(customer)/tiffin' as any)}
            testID="subscriptions-active-empty"
          />
        )
      ) : isPast ? (
        <View style={styles.cardPad}>
          <GourmeatCard testID="subscription-past-card">
            <Text style={styles.kitchenName}>{kitchen?.cook?.display_name || 'Tiffin kitchen'}</Text>
            <Text style={styles.meta}>Ended · Subscribe again anytime</Text>
            <GourmeatPrimaryButton
              label="Browse kitchens"
              onPress={() => router.push('/(customer)/tiffin' as any)}
              style={{ marginTop: shcSpacing.md }}
            />
          </GourmeatCard>
        </View>
      ) : (
        <GourmeatEmptyState
          illustration="no_past_sub"
          title={pastCopy.title}
          testID="subscriptions-past-empty"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  back: { fontSize: 28, fontWeight: '300', color: gourmeatColors.text, width: 28 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: gourmeatColors.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
    marginHorizontal: shcSpacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: gourmeatColors.text },
  tabLabel: { fontSize: 13, fontWeight: '700', color: gourmeatColors.textLight },
  tabLabelOn: { color: gourmeatColors.text },
  cardPad: { padding: shcSpacing.md },
  kitchenName: { fontSize: 18, fontWeight: '900', color: gourmeatColors.text },
  meta: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 6 },
});
