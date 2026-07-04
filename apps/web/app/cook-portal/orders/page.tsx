'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { getOrderStatusLabel } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useCookOrders, useCookTransitionOrder } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatCard,
  GourmeatEmptyState,
} from '../../components/SHCWebComponents';

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept' }],
  accepted: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookOrdersPage() {
  const router = useRouter();
  const { user } = useCookAuth();
  const { data: orders = [] } = useCookOrders();
  const transMut = useCookTransitionOrder();

  const pendingCount = orders.filter(
    (o: { shc_status?: string }) => !['collected', 'completed'].includes(String(o.shc_status))
  ).length;

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    try {
      await transMut.mutateAsync({ orderId, to });
    } catch (e) {
      alert((e as Error).message || 'Transition failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-orders-screen">
      <GourmeatCookHeader
        title="Orders"
        subtitle={user?.name}
        badges={
          pendingCount > 0 ? (
            <span className="text-[11px] font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
              {pendingCount} active
            </span>
          ) : undefined
        }
      />

      {orders.length === 0 && (
        <GourmeatCard>
          <GourmeatEmptyState title="No orders yet" body="New collection orders will appear here." />
        </GourmeatCard>
      )}

      {orders.map((o: Record<string, unknown>) => {
        const status = String(o.shc_status || '');
        const actions = NEXT_ACTIONS[status] || [];
        const dishName = String((o.items as { name?: string }[])?.[0]?.name || '');
        return (
          <GourmeatOrderRow
            key={String(o.id)}
            orderId={String(o.id)}
            dishName={dishName}
            productId={String((o.items as { product_id?: string }[])?.[0]?.product_id || '')}
            statusLabel={getOrderStatusLabel(status)}
            collectionDate={o.collection_date ? String(o.collection_date) : undefined}
            collectionSlot={o.collection_slot ? String(o.collection_slot) : undefined}
            total={o.total as number}
            onPress={() => router.push(`/cook-portal/orders/${o.id}`)}
            testID={`cook-order-row-${o.id}`}
            actions={
              <>
                {actions.map((a) => (
                  <GourmeatPrimaryButton
                    key={a.to}
                    label={a.label}
                    onClick={() => doTransition(String(o.id), a.to)}
                  />
                ))}
                <Link
                  href={`/cook-portal/orders/${o.id}`}
                  className="inline-flex items-center px-3 py-2 rounded-xl border border-border bg-card text-sm font-bold"
                >
                  Details
                </Link>
              </>
            }
          />
        );
      })}

      <Link
        href="/cook-portal/listings"
        className="block mt-6 text-center bg-primary text-primary-foreground font-extrabold py-3.5 rounded-xl"
      >
        Manage listings →
      </Link>
    </div>
  );
}