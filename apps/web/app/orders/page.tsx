'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { getActiveOrders, getOrderStatusLabel, isActiveOrderStatus } from '@shc/utils';
import { useOrders } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { GourmeatScreenHeader, GourmeatOrderRow, SHCEmptyState } from '../components/SHCWebComponents';

export default function OrdersList() {
  const { user } = useAuth();
  const { data: orders = [], isLoading, isFetching } = useOrders();
  const activeOrders = getActiveOrders(orders as Record<string, unknown>[]);
  const pastOrders = (orders as Record<string, unknown>[]).filter(
    (o) => !isActiveOrderStatus(String(o.shc_status || ''))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-10">
      <GourmeatScreenHeader
        title="My Orders"
        subtitle={`${user?.name?.split(' ')[0] || 'Guest'} · tap to track${isFetching && activeOrders.length > 0 ? ' · updating…' : ''}`}
      />

      {activeOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-extrabold text-foreground mb-3">In progress</h2>
          <div className="space-y-3">
            {activeOrders.map((o) => {
              const status = String(o.shc_status || 'pending');
              const dishName = (o.items as Array<{ name?: string; product_id?: string }>)?.[0]?.name || 'Order';
              const productId = (o.items as Array<{ product_id?: string }>)?.[0]?.product_id;
              return (
                <GourmeatOrderRow
                  key={String(o.id)}
                  orderId={String(o.id)}
                  dishName={dishName}
                  productId={productId}
                  statusLabel={getOrderStatusLabel(status)}
                  collectionDate={String(o.collection_date || '')}
                  collectionSlot={String(o.collection_slot || '')}
                  total={Number(o.total || 0)}
                  href={`/orders/${o.id}`}
                  testID={`active-order-row-${o.id}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Package className="w-5 h-5 animate-pulse" aria-hidden />
          <span className="font-semibold">Loading…</span>
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="bg-card rounded-2xl shadow-[var(--shc-shadow-card)] p-8 text-center">
          <SHCEmptyState
            title="No orders yet"
            action={
              <Link href="/" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
                Browse dishes →
              </Link>
            }
          />
        </div>
      )}

      {pastOrders.length > 0 && activeOrders.length > 0 && (
        <h2 className="text-base font-extrabold text-foreground mb-3">Past orders</h2>
      )}

      <div className="space-y-3">
        {pastOrders.map((o) => {
          const status = String(o.shc_status || 'pending');
          const dishName = (o.items as Array<{ name?: string; product_id?: string }>)?.[0]?.name || 'Order';
          const productId = (o.items as Array<{ product_id?: string }>)?.[0]?.product_id;
          return (
            <GourmeatOrderRow
              key={String(o.id)}
              orderId={String(o.id)}
              dishName={dishName}
              productId={productId}
              statusLabel={getOrderStatusLabel(status)}
              collectionDate={String(o.collection_date || '')}
              collectionSlot={String(o.collection_slot || '')}
              total={String(o.total)}
              href={`/orders/${o.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}