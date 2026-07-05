'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { getOrderStatusLabel } from '@shc/utils';
import { useCookOrder, useCookTransitionOrder } from '../../../../lib/useCookPortal';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCLoading,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../../components/SHCWebComponents';

const NEXT: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept order' }],
  accepted: [{ to: 'preparing', label: 'Start preparing' }],
  preparing: [{ to: 'ready_for_collection', label: 'Mark ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Mark collected' }],
};

export default function CookOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: order, isLoading } = useCookOrder(id);
  const transMut = useCookTransitionOrder();
  const { openTray, dismiss } = useSHCTrayWeb();

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label="Loading order…" />
      </div>
    );
  }

  const status = String(order.shc_status || '');
  const actions = NEXT[status] || [];

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayActionWeb
        message={`Advance this order to “${label}”? The customer will see the update immediately.`}
        primaryLabel={label}
        onPrimary={async () => {
          dismiss();
          try {
            await transMut.mutateAsync({ orderId: id, to });
          } catch (e) {
            openTray(
              { id: 'order-status-error', title: 'Update failed', height: 'compact' },
              <SHCTrayActionWeb message={(e as Error).message} primaryLabel="OK" onPrimary={dismiss} testID="order-status-error-tray" />
            );
          }
        }}
        secondaryLabel="Cancel"
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GourmeatScreenHeader
        title={getOrderStatusLabel(status)}
        subtitle={`Order ${id}`}
        backHref="/cook-portal/orders"
        backLabel="← Orders"
      />

      <GourmeatCard className="mb-4">
        <p className="font-extrabold">{String((order.items as { name?: string }[])?.[0]?.name || 'Order')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {order.collection_date} · {order.collection_slot}
        </p>
        <p className="text-lg font-extrabold text-primary mt-2">S${order.total}</p>
        <p className="text-xs text-muted-foreground mt-2">Cook: {order.cook_name}</p>
      </GourmeatCard>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <GourmeatPrimaryButton
            key={a.to}
            label={transMut.isPending ? 'Updating…' : a.label}
            disabled={transMut.isPending}
            onClick={() => confirmTransition(a.to, a.label)}
            testID={`cook-portal-order-transition-${a.to}`}
          />
        ))}
      </div>

      <Link href="/cook-portal/orders" className="block text-center text-sm font-semibold text-primary mt-8">
        Back to orders
      </Link>
    </div>
  );
}