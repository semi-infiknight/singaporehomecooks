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

export default function CookEarningsPage() {
  const { user } = useCookAuth();
  const { data: earnings = { thisWeek: 0, projectedPayout: 0, orders_count: 0 } } = useCookEarnings();
  const { data: expenses = { expenses: [], total_cents: 0 } } = useCookExpenses();
  const expenseMut = useCreateCookExpense();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('ingredients');

  const weekTotal = (earnings as { thisWeek?: number }).thisWeek ?? 0;
  const orderCount =
    (earnings as { orders_count?: number }).orders_count ??
    (earnings as { orders?: number }).orders ??
    0;

  const submitExpense = () => {
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      alert('Enter an expense amount, e.g. 18.50');
      return;
    }
    expenseMut.mutate({
      amount_cents: Math.round(amount * 100),
      category: expenseCategory.trim() || 'ingredients',
      date: new Date().toISOString().slice(0, 10),
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
            <SHCBadge variant="heritage">This week</SHCBadge>
            <SHCBadge variant="success">S${weekTotal}</SHCBadge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 mb-6">
        <GourmeatCard className="bg-[var(--shc-bento-mint)]">
          <p className="text-xs font-bold text-muted-foreground">Projected</p>
          <p className="text-xl font-black">S${(earnings as { projectedPayout?: number }).projectedPayout || weekTotal}</p>
        </GourmeatCard>
        <GourmeatCard className="bg-[var(--shc-bento-yellow)]">
          <p className="text-xs font-bold text-muted-foreground">Completed</p>
          <p className="text-xl font-black">{orderCount} orders</p>
        </GourmeatCard>
      </div>

      <p className="text-sm font-extrabold mb-2">Quick actions</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <VisualBentoTile imageUrl={BENTO_ACTION_IMAGES.listings} label="Listings" href="/cook-portal/listings" variant="bento-peach" />
        <VisualBentoTile imageUrl={BENTO_ACTION_IMAGES.orders} label="Orders" href="/cook-portal/orders" variant="bento-mint" />
      </div>

      <GourmeatCard>
        <p className="font-extrabold text-sm mb-2">Log expense</p>
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm mb-2"
          placeholder="Amount S$"
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-border px-3 py-2 text-sm mb-3"
          placeholder="Category"
          value={expenseCategory}
          onChange={(e) => setExpenseCategory(e.target.value)}
        />
        <GourmeatPrimaryButton label="Add expense" onClick={submitExpense} disabled={expenseMut.isPending} />
        {(expenses.expenses || []).length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            Total logged: S${Math.round((expenses.total_cents || 0) / 100)}
          </p>
        )}
      </GourmeatCard>

      <Link href="/cook-portal/dashboard" className="block text-center text-sm font-semibold text-primary mt-8">
        ← Dashboard
      </Link>
    </div>
  );
}