import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  COOK_EARNINGS_CREATE_LISTINGS_CTA,
  COOK_EARNINGS_EXPENSE_EMPTY,
  COOK_EARNINGS_IRAS_NOTE,
  formatCookExpenseRowAmount,
  formatCookExpenseTotalDollars,
  formatCookLastPayoutLine,
  formatCookNextPayoutLine,
  recentCookExpenses,
  type CookEarningsSummary,
  type CookExpenseRow,
} from '@shc/utils';
import { shcColors, shcSpacing } from './theme';
import { SHCButton, SHCButtonText, SHCCard, SHCMetaBadge } from './primitives';

export function SHCCookEarningsIrasNote({ testID = 'cook-earnings-iras-note' }: { testID?: string }) {
  return (
    <SHCCard variant="bento-peach" style={styles.noteCard} testID={testID}>
      <Text style={styles.noteText}>{COOK_EARNINGS_IRAS_NOTE}</Text>
    </SHCCard>
  );
}

export function SHCCookEarningsPayoutStatus({
  earnings,
  onSetupPaynow,
  testID = 'cook-earnings-payout-status',
}: {
  earnings: CookEarningsSummary;
  onSetupPaynow?: () => void;
  testID?: string;
}) {
  return (
    <SHCCard variant="bento-mint" style={styles.payoutCard} testID={testID}>
      <Text style={styles.payoutLine}>{formatCookLastPayoutLine(earnings.last_payout)}</Text>
      <Text style={styles.payoutLine}>{formatCookNextPayoutLine(earnings.next_payout)}</Text>
      {!earnings.paynow_configured && onSetupPaynow ? (
        <SHCButton onPress={onSetupPaynow} testID="cook-earnings-setup-paynow" style={{ marginTop: shcSpacing.sm }}>
          <SHCButtonText>Add PayNow for payouts</SHCButtonText>
        </SHCButton>
      ) : null}
    </SHCCard>
  );
}

export function SHCCookEarningsCreateListingsCta({
  onPress,
  testID = 'create-listings-btn',
}: {
  onPress: () => void;
  testID?: string;
}) {
  return (
    <SHCButton onPress={onPress} testID={testID} style={{ marginTop: shcSpacing.md }}>
      <SHCButtonText>{COOK_EARNINGS_CREATE_LISTINGS_CTA}</SHCButtonText>
    </SHCButton>
  );
}

export function SHCCookEarningsExpenseTracker({
  expenses,
  totalCents,
  expenseAmount,
  expenseCategory,
  onExpenseAmountChange,
  onExpenseCategoryChange,
  onSubmit,
  isSubmitting,
  testID = 'cook-earnings-expense-tracker',
}: {
  expenses: CookExpenseRow[];
  totalCents: number;
  expenseAmount: string;
  expenseCategory: string;
  onExpenseAmountChange: (value: string) => void;
  onExpenseCategoryChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  testID?: string;
}) {
  const expenseRows = recentCookExpenses(expenses);

  return (
    <View testID={testID}>
      <Text style={styles.sectionLabel}>Expense tracker</Text>
      <SHCCard variant="bento-mint" style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View>
            <Text style={styles.statLabel}>Recorded this year</Text>
            <Text style={styles.statValue}>{formatCookExpenseTotalDollars(totalCents)}</Text>
          </View>
          <SHCMetaBadge kind="tax">IRAS</SHCMetaBadge>
        </View>
        <View style={styles.expenseForm}>
          <TextInput
            value={expenseAmount}
            onChangeText={onExpenseAmountChange}
            keyboardType="decimal-pad"
            placeholder="Amount, e.g. 18.50"
            placeholderTextColor={shcColors.textLight}
            style={styles.input}
            testID="expense-amount-input"
          />
          <TextInput
            value={expenseCategory}
            onChangeText={onExpenseCategoryChange}
            placeholder="Category"
            placeholderTextColor={shcColors.textLight}
            style={styles.input}
            testID="expense-category-input"
          />
          <SHCButton onPress={onSubmit} disabled={isSubmitting} testID="expense-submit-btn">
            <SHCButtonText>{isSubmitting ? 'Saving…' : 'Log expense'}</SHCButtonText>
          </SHCButton>
        </View>
        {expenseRows.length === 0 ? (
          <Text style={styles.emptyText}>{COOK_EARNINGS_EXPENSE_EMPTY}</Text>
        ) : (
          <View style={styles.expenseList}>
            {expenseRows.map((expense) => (
              <View key={expense.id} style={styles.expenseRow}>
                <View>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>{expense.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>{formatCookExpenseRowAmount(expense.amount_cents || 0)}</Text>
              </View>
            ))}
          </View>
        )}
      </SHCCard>
    </View>
  );
}

const styles = StyleSheet.create({
  noteCard: { marginTop: shcSpacing.md, padding: shcSpacing.md },
  payoutCard: { marginTop: shcSpacing.md, padding: shcSpacing.md },
  payoutLine: { fontSize: 13, fontWeight: '700', color: shcColors.text, lineHeight: 20 },
  noteText: { fontSize: 12, color: shcColors.textLight, lineHeight: 18 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: shcColors.text,
    marginTop: shcSpacing.lg,
    marginBottom: shcSpacing.sm,
  },
  expenseCard: { padding: shcSpacing.md },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', color: shcColors.textLight, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: '900', color: shcColors.text, marginTop: 4 },
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
