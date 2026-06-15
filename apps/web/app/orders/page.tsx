'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useOrders } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { SHCCard, SHCBadge, SHCEmptyState, SHCPageHeader } from '../components/SHCWebComponents';

const statusLabels: Record<string, string> = {
  pending: 'Pending payment',
  paid: 'Payment received',
  accepted: 'Cook confirmed',
  preparing: 'Being prepared',
  ready: 'Ready for collection',
  collected: 'Collected',
  completed: 'Completed',
};

export default function OrdersList() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useOrders();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SHCPageHeader
        title="Your orders"
        subtitle="Track collection times, chat with your cook, and leave reviews after pickup."
      />

      {isLoading && <p className="text-[#5C5144]">Loading orders…</p>}

      {!isLoading && orders.length === 0 && (
        <SHCEmptyState
          title="No orders yet"
          description="Once you place an order, it will appear here with your collection slot and status."
          action={
            <Link href="/">
              <span className="inline-block px-4 py-2 bg-[#1D9E75] text-white rounded-lg font-semibold text-sm">
                Browse dishes
              </span>
            </Link>
          }
        />
      )}

      <div className="space-y-3">
        {(orders as Array<Record<string, unknown>>).map((o) => {
          const status = String(o.shc_status || 'pending');
          const label = statusLabels[status] || status;
          return (
            <Link key={String(o.id)} href={`/orders/${o.id}`}>
              <SHCCard hover className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-[#2C2416] truncate">
                    {(o.items as Array<{ name?: string }>)?.[0]?.name || 'Order'}
                  </div>
                  <div className="text-sm text-[#5C5144] mt-0.5">
                    {String(o.collection_date)} · {String(o.collection_slot)}
                  </div>
                  <div className="mt-2">
                    <SHCBadge variant={status === 'completed' || status === 'collected' ? 'success' : 'default'}>
                      {label}
                    </SHCBadge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold tabular-nums">S${String(o.total)}</span>
                  <ChevronRight className="w-4 h-4 text-[#5C5144]" aria-hidden />
                </div>
              </SHCCard>
            </Link>
          );
        })}
      </div>

      {false && (
        <div className="mt-8 text-center">
          <Link href="/cook-portal" className="text-sm text-[#1D9E75] font-medium hover:underline">
            Open cook dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}