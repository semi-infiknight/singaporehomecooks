import React, { useState } from 'react';
import { Alert, Text, TextInput, View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import {
  gourmeatColors,
  shcColors,
  GourmeatCookHeader,
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  SHCBadge,
  SHCFadeIn,
  shcSpacing,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCookExpense, getEarnings, listCookExpenses } from '../../lib/api-client';

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: earnings = { thisWeek: 0, projectedPayout: 0, orders_count: 0 } } = useQuery({
    queryKey: ['earnings'],
    queryFn: getEarnings,
  });
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

  const weekTotal = earnings.thisWeek ?? 0;
  const orderCount = (earnings as { orders_count?: number; orders?: number }).orders_count
    ?? (earnings as { orders?: number }).orders
    ?? 0;
  const expenseTotal = Math.round((expenses.total_cents || 0) / 100);
  const expenseRows = expenses.expenses || [];

  const submitExpense = () => {
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Enter an expense amount', 'Use Singapore dollars, e.g. 18.50');
      return;
    }
    expenseMut.mutate({
      amount_cents: Math.round(amount * 100),
      category: expenseCategory.trim() || 'ingredients',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-earnings-screen"
    >
      <GourmeatCookHeader
        title="Earnings"
        subtitle={`${user?.name} · 85% payout · PayNow weekly`}
        badges={
          <View style={styles.heroBadges}>
            <SHCBadge variant="heritage">This week</SHCBadge>
            <SHCBadge variant="success">S${weekTotal}</SHCBadge>
          </View>
        }
      />

      <SHCFadeIn delay={60}>
        <View style={styles.statsRow}>
          <SHCCard variant="bento-mint" style={styles.statCard}>
            <Text style={styles.statLabel}>Projected</Text>
            <Text style={styles.statValue}>S${earnings.projectedPayout || weekTotal}</Text>
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

      <Link href="/(cook)/listings" asChild>
        <SHCButton testID="create-listings-btn" style={{ marginTop: shcSpacing.md }}>
          <SHCButtonText>Create more listings for earnings</SHCButtonText>
        </SHCButton>
      </Link>

      <SHCCard variant="bento-peach" style={styles.noteCard}>
        <Text style={styles.noteText}>
          Platform fees and cook expenses are tracked for IRAS records. Annual exports remain an ops workflow.
        </Text>
      </SHCCard>

      <Text style={styles.sectionLabel}>Expense tracker</Text>
      <SHCCard variant="bento-mint" style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View>
            <Text style={styles.statLabel}>Recorded this year</Text>
            <Text style={styles.statValue}>S${expenseTotal}</Text>
          </View>
          <SHCBadge variant="heritage">IRAS</SHCBadge>
        </View>
        <View style={styles.expenseForm}>
          <TextInput
            value={expenseAmount}
            onChangeText={setExpenseAmount}
            keyboardType="decimal-pad"
            placeholder="Amount, e.g. 18.50"
            placeholderTextColor={shcColors.textLight}
            style={styles.input}
            testID="expense-amount-input"
          />
          <TextInput
            value={expenseCategory}
            onChangeText={setExpenseCategory}
            placeholder="Category"
            placeholderTextColor={shcColors.textLight}
            style={styles.input}
            testID="expense-category-input"
          />
          <SHCButton onPress={submitExpense} disabled={expenseMut.isPending} testID="expense-submit-btn">
            <SHCButtonText>{expenseMut.isPending ? 'Saving…' : 'Log expense'}</SHCButtonText>
          </SHCButton>
        </View>
        {expenseRows.length === 0 ? (
          <Text style={styles.emptyText}>No expenses yet. Log ingredient receipts as you buy for orders.</Text>
        ) : (
          <View style={styles.expenseList}>
            {expenseRows.slice(0, 5).map((expense: any) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>{expense.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>S${((expense.amount_cents || 0) / 100).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </SHCCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsRow: { flexDirection: 'row', gap: shcSpacing.sm, marginTop: shcSpacing.md },
  statCard: { flex: 1, padding: shcSpacing.md },
  statLabel: { fontSize: 11, fontWeight: '700', color: shcColors.textLight, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900', color: shcColors.text, marginTop: 4 },
  sectionLabel: { fontSize: 16, fontWeight: '900', color: shcColors.text, marginTop: shcSpacing.lg, marginBottom: shcSpacing.sm },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm },
  bentoCol: { flex: 1 },
  noteCard: { marginTop: shcSpacing.md, padding: shcSpacing.md },
  noteText: { fontSize: 12, color: shcColors.textLight, lineHeight: 18 },
  expenseCard: { padding: shcSpacing.md },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseForm: { gap: shcSpacing.sm, marginTop: shcSpacing.md },
  input: {
    minHeight: 44,
    borderWidth: 2,
    borderColor: shcColors.border,
    borderRadius: 12,
    backgroundColor: shcColors.surface,
    color: shcColors.text,
    paddingHorizontal: shcSpacing.md,
    fontWeight: '700',
  },
  emptyText: { marginTop: shcSpacing.md, fontSize: 12, color: shcColors.textLight, lineHeight: 18 },
  expenseList: { marginTop: shcSpacing.md, gap: shcSpacing.sm },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: shcSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: shcColors.borderLight,
    paddingTop: shcSpacing.sm,
  },
  expenseCategory: { fontSize: 13, fontWeight: '800', color: shcColors.text },
  expenseDate: { fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginTop: 2 },
  expenseAmount: { fontSize: 13, fontWeight: '900', color: shcColors.text },
});