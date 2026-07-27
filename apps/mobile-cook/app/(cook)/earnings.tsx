import React, { useState } from 'react';
import { Alert, Text, View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  gourmeatColors,
  GourmeatCookHeader,
  SHCCard,
  SHCVisualBentoTile,
  SHCMetaBadge,
  SHCFadeIn,
  SHCCookEarningsCreateListingsCta,
  SHCCookEarningsExpenseTracker,
  SHCCookEarningsIrasNote,
  shcSpacing,
  contentPadForTabBar,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  cookEarningsOrderCount,
  cookEarningsProjectedDisplay,
  cookEarningsWeekTotal,
  defaultExpenseCategory,
  parseExpenseAmountToCents,
  todayExpenseDateIso,
  type CookEarningsView,
} from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCookExpense, getEarnings, listCookExpenses } from '../../lib/api-client';

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: earningsRaw } = useQuery({
    queryKey: ['earnings'],
    queryFn: getEarnings,
  });
  const earnings: CookEarningsView = earningsRaw ?? { thisWeek: 0, projectedPayout: 0, orders_count: 0 };
  const { data: expenses = { expenses: [], total_cents: 0 } } = useQuery({
    queryKey: ['cook-expenses'],
    queryFn: listCookExpenses,
  });
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('ingredients');
  const expenseMut = useMutation({
    mutationFn: createCookExpense,
    onSuccess: () => {
      setExpenseAmount('');
      qc.invalidateQueries({ queryKey: ['cook-expenses'] });
    },
    onError: (e) => Alert.alert('Could not log expense', (e as Error).message || 'Please try again.'),
  });

  const weekTotal = cookEarningsWeekTotal(earnings);
  const orderCount = cookEarningsOrderCount(earnings);
  const projected = cookEarningsProjectedDisplay(earnings);

  const submitExpense = () => {
    const amountCents = parseExpenseAmountToCents(expenseAmount);
    if (!amountCents) {
      Alert.alert('Enter an expense amount', 'Use Singapore dollars, e.g. 18.50');
      return;
    }
    expenseMut.mutate({
      amount_cents: amountCents,
      category: defaultExpenseCategory(expenseCategory),
      date: todayExpenseDateIso(),
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
      testID="cook-earnings-screen"
    >
      <GourmeatCookHeader
        title="Earnings"
        subtitle={`${user?.name || 'Chef'} · PayNow weekly`}
        badges={
          <View style={styles.heroBadges}>
            <SHCMetaBadge kind="period">This week</SHCMetaBadge>
            <SHCMetaBadge kind="earnings">S${weekTotal}</SHCMetaBadge>
          </View>
        }
      />

      <SHCFadeIn delay={60}>
        <View style={styles.statsRow}>
          <SHCCard variant="bento-mint" style={styles.statCard}>
            <Text style={styles.statLabel}>Projected</Text>
            <Text style={styles.statValue}>S${projected}</Text>
          </SHCCard>
          <SHCCard variant="bento-yellow" style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{orderCount} orders</Text>
          </SHCCard>
        </View>
      </SHCFadeIn>

      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.bentoRow}>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.listings}
            iconKey="listings"
            label="Listings"
            variant="bento-peach"
            testID="earnings-listings-tile"
            onPress={() => router.push('/(cook)/listings' as any)}
          />
        </View>
        <View style={styles.bentoCol}>
          <SHCVisualBentoTile
            imageUri={BENTO_ACTION_IMAGES.orders}
            iconKey="orders"
            label="Orders"
            variant="bento-mint"
            testID="earnings-orders-tile"
            onPress={() => router.push('/(cook)/orders' as any)}
          />
        </View>
      </View>

      <SHCCookEarningsCreateListingsCta onPress={() => router.push('/(cook)/listings' as any)} />
      <SHCCookEarningsIrasNote />

      <SHCCookEarningsExpenseTracker
        expenses={expenses.expenses || []}
        totalCents={expenses.total_cents || 0}
        expenseAmount={expenseAmount}
        expenseCategory={expenseCategory}
        onExpenseAmountChange={setExpenseAmount}
        onExpenseCategoryChange={setExpenseCategory}
        onSubmit={submitExpense}
        isSubmitting={expenseMut.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsRow: { flexDirection: 'row', gap: shcSpacing.sm, marginTop: shcSpacing.md },
  statCard: { flex: 1, padding: shcSpacing.md },
  statLabel: { fontSize: 11, fontWeight: '700', color: gourmeatColors.textLight, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900', color: gourmeatColors.text, marginTop: 4 },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: gourmeatColors.text, marginTop: shcSpacing.lg, marginBottom: shcSpacing.sm },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm },
  bentoCol: { flex: 1 },
});
