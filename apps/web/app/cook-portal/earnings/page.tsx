'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BENTO_ACTION_IMAGES,
  defaultExpenseCategory,
  formatCookEarningsDisplay,
  parseExpenseAmountToCents,
  resolveCookEarningsSummary,
  todayExpenseDateIso,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookEarnings, useCookExpenses, useCreateCookExpense } from '../../../lib/useCookPortal';
import {
  CookEarningsCreateListingsCtaWeb,
  CookEarningsExpenseTrackerWeb,
  CookEarningsIrasNoteWeb,
  GourmeatCookHeader,
  GourmeatCard,
  SHCMetaBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';

export default function CookEarningsPage() {
  const { user } = useCookAuth();
  const { data: earningsRaw } = useCookEarnings();
  const earnings = resolveCookEarningsSummary(earningsRaw as Record<string, unknown> | undefined);
  const weekTotalLabel = formatCookEarningsDisplay(earnings.this_week_cents);
  const projectedLabel = formatCookEarningsDisplay(earnings.projected_payout_cents);
  const orderCount = earnings.orders_count;
  const { data: expenses = { expenses: [], total_cents: 0 } } = useCookExpenses();
  const expenseMut = useCreateCookExpense();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('ingredients');

  const submitExpense = () => {
    const amountCents = parseExpenseAmountToCents(expenseAmount);
    if (!amountCents) {
      alert('Enter an expense amount, e.g. 18.50');
      return;
    }
    expenseMut.mutate({
      amount_cents: amountCents,
      category: defaultExpenseCategory(expenseCategory),
      date: todayExpenseDateIso(),
    });
    setExpenseAmount('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-earnings-screen">
      <GourmeatCookHeader
        title="Earnings"
        subtitle={`${user?.name || 'Chef'} · PayNow weekly`}
        badges={
          <>
            <SHCMetaBadge kind="period">This week</SHCMetaBadge>
            <SHCMetaBadge kind="earnings">{weekTotalLabel}</SHCMetaBadge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 mb-6 mt-4">
        <GourmeatCard className="bg-[var(--shc-bento-mint)]">
          <p className="text-xs font-bold text-muted-foreground uppercase">Projected</p>
          <p className="text-xl font-black">{projectedLabel}</p>
        </GourmeatCard>
        <GourmeatCard className="bg-[var(--shc-bento-yellow)]">
          <p className="text-xs font-bold text-muted-foreground uppercase">Completed</p>
          <p className="text-xl font-black">{orderCount} orders</p>
        </GourmeatCard>
      </div>

      <p className="text-sm font-extrabold mb-2">Quick actions</p>
      <div className="grid grid-cols-2 gap-2">
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.listings}
          label="Listings"
          href="/cook-portal/listings"
          variant="bento-peach"
          testID="earnings-listings-tile"
        />
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.orders}
          label="Orders"
          href="/cook-portal/orders"
          variant="bento-mint"
          testID="earnings-orders-tile"
        />
      </div>

      <CookEarningsCreateListingsCtaWeb href="/cook-portal/listings" />
      <CookEarningsIrasNoteWeb />

      <CookEarningsExpenseTrackerWeb
        expenses={expenses.expenses || []}
        totalCents={expenses.total_cents || 0}
        expenseAmount={expenseAmount}
        expenseCategory={expenseCategory}
        onExpenseAmountChange={setExpenseAmount}
        onExpenseCategoryChange={setExpenseCategory}
        onSubmit={submitExpense}
        isSubmitting={expenseMut.isPending}
      />

      <Link href="/cook-portal/dashboard" className="block text-center text-sm font-semibold text-primary mt-8">
        ← Dashboard
      </Link>
    </div>
  );
}
