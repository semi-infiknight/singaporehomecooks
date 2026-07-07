'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { useCookOrder, useCookTransitionOrder } from '../../../../lib/useCookPortal';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCLoading,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../../components/SHCWebComponents';
import {
  useShcI18n,
  getCookOrderTransitionActions,
  getLocalizedOrderStatus,
  getCookOrderDetailCopy,
} from '@shc/i18n';

export default function CookOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { locale } = useShcI18n();
  const copy = getCookOrderDetailCopy(locale);
  const { data: order, isLoading } = useCookOrder(id);
  const transMut = useCookTransitionOrder();
  const { openTray, dismiss } = useSHCTrayWeb();

  const nextActions = useMemo(() => {
    const actions = getCookOrderTransitionActions(locale);
    return Object.fromEntries(actions.map((a) => [a.status, [{ to: a.to, label: a.label }]])) as Record<
      string,
      { to: SHCOrderStatus; label: string }[]
    >;
  }, [locale]);

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label={copy.loading} />
      </div>
    );
  }

  const status = String(order.shc_status || '');
  const actions = nextActions[status] || [];

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayActionWeb
        message={copy.confirmMessage.replace('{label}', label)}
        primaryLabel={label}
        onPrimary={async () => {
          dismiss();
          try {
            await transMut.mutateAsync({ orderId: id, to });
          } catch (e) {
            openTray(
              { id: 'order-status-error', title: copy.trayErrorTitle, height: 'compact' },
              <SHCTrayActionWeb message={(e as Error).message} primaryLabel={copy.ok} onPrimary={dismiss} testID="order-status-error-tray" />
            );
          }
        }}
        secondaryLabel={copy.cancel}
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GourmeatScreenHeader
        title={getLocalizedOrderStatus(locale, status)}
        subtitle={copy.orderSubtitle(id)}
        backHref="/cook-portal/orders"
        backLabel={copy.backOrders}
      />

      <GourmeatCard className="mb-4">
        <p className="font-extrabold">{String((order.items as { name?: string }[])?.[0]?.name || copy.orderTitle(id))}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {order.collection_date} · {order.collection_slot}
        </p>
        <p className="text-lg font-extrabold text-primary mt-2">S${order.total}</p>
        <p className="text-xs text-muted-foreground mt-2">{copy.cookLabel(String(order.cook_name || ''))}</p>
      </GourmeatCard>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <GourmeatPrimaryButton
            key={a.to}
            label={transMut.isPending ? copy.updating : a.label}
            disabled={transMut.isPending}
            onClick={() => confirmTransition(a.to, a.label)}
            testID={`cook-portal-order-transition-${a.to}`}
          />
        ))}
      </div>

      <Link href="/cook-portal/orders" className="block text-center text-sm font-semibold text-primary mt-8">
        {copy.backToOrders}
      </Link>
    </div>
  );
}
