'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookEarnings, useCookExpenses, useCreateCookExpense } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';
import { useShcI18n, getCookEarningsCopy, getCookQuickActionLabels } from '@shc/i18n';

export default function CookEarningsPage() {
  const { user } = useCookAuth();
  const { locale } = useShcI18n();
  const copy = getCookEarningsCopy(locale);
  const quick = getCookQuickActionLabels(locale);
  const { data: earnings = { thisWeek: 0, projectedPayout: 0, orders_count: 0 } } = useCookEarnings();
  const { data: expenses = { expenses: [], total_cents: 0 } } = useCookExpenses();
  const expenseMut = useCreateCookExpense();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(copy.defaultCategory);

  const weekTotal = (earnings as { thisWeek?: number }).thisWeek ?? 0;
  const orderCount =
    (earnings as { orders_count?: number }).orders_count ??
    (earnings as { orders?: number }).orders ??
    0;

  const submitExpense = () => {
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      alert(copy.expenseInvalidBody);
      return;
    }
    expenseMut.mutate({
      amount_cents: Math.round(amount * 100),
      category: expenseCategory.trim() || copy.defaultCategory,
      date: new Date().toISOString().slice(0, 10),
    });
    setExpenseAmount('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-earnings-screen">
      <GourmeatCookHeader
        title={copy.title}
        subtitle={copy.subtitleFor(user?.name || '')}
        badges={
          <>
            <SHCBadge variant="heritage">{copy.thisWeek}</SHCBadge>
            <SHCBadge variant="success">{copy.weekAmountBadge(weekTotal)}</SHCBadge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 mb-6">
        <GourmeatCard className="bg-[var(--shc-bento-mint)]">
          <p className="text-xs font-bold text-muted-foreground">{copy.projected}</p>
          <p className="text-xl font-black">S${(earnings as { projectedPayout?: number }).projectedPayout || weekTotal}</p>
        </GourmeatCard>
        <GourmeatCard className="bg-[var(--shc-bento-yellow)]">
          <p className="text-xs font-bold text-muted-foreground">{copy.completed}</p>
          <p className="text-xl font-black">{copy.ordersCountLabel(orderCount)}</p>
        </GourmeatCard>
      </div>

      <p className="text-sm font-extrabold mb-2">{copy.quickActions}</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <VisualBentoTile imageUrl={BENTO_ACTION_IMAGES.listings} label={quick.listings} href="/cook-portal/listings" variant="bento-peach" />
        <VisualBentoTile imageUrl={BENTO_ACTION_IMAGES.orders} label={quick.orders} href="/cook-portal/orders" variant="bento-mint" />
      </div>

      <GourmeatCard>
        <p className="font-extrabold text-sm mb-2">{copy.logExpense}</p>
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm mb-2"
          placeholder={copy.amountPlaceholder}
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm mb-3"
          placeholder={copy.categoryPlaceholder}
          value={expenseCategory}
          onChange={(e) => setExpenseCategory(e.target.value)}
        />
        <GourmeatPrimaryButton label={copy.addExpenseBtn} onClick={submitExpense} disabled={expenseMut.isPending} />
        {(expenses.expenses || []).length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {copy.totalLogged(Math.round((expenses.total_cents || 0) / 100))}
          </p>
        )}
      </GourmeatCard>

      <Link href="/cook-portal/dashboard" className="block text-center text-sm font-semibold text-primary mt-8">
        {copy.backDashboard}
      </Link>
    </div>
  );
}
