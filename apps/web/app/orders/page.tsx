'use client';

import { Package } from 'lucide-react';
import { getActiveOrders, isActiveOrderStatus } from '@shc/utils';
import { useOrders } from '../../lib/useOrder';
import { useAuth } from '../../lib/useAuth';
import { useShcI18n, getOrdersListCopy, getLocalizedOrderStatus } from '@shc/i18n';
import { GourmeatScreenHeader, GourmeatOrderRow, GourmeatPrimaryButton, GourmeatCard, SHCEmptyState } from '../components/SHCWebComponents';

export default function OrdersList() {
  const { t, locale } = useShcI18n();
  const listCopy = getOrdersListCopy(locale);
  const { user } = useAuth();
  const { data: orders = [], isLoading, isFetching } = useOrders();
  const activeOrders = getActiveOrders(orders as Record<string, unknown>[]);
  const pastOrders = (orders as Record<string, unknown>[]).filter(
    (o) => !isActiveOrderStatus(String(o.shc_status || ''))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-10">
      <GourmeatScreenHeader
        title={t('orders.title')}
        subtitle={listCopy.subtitle(user?.name?.split(' ')[0] || listCopy.guest, isFetching && activeOrders.length > 0)}
      />

      {activeOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-extrabold text-foreground mb-3">
            {activeOrders.length > 1
              ? listCopy.inProgressLabel(activeOrders.length)
              : t('orders.in_progress')}
          </h2>
          <div className="space-y-3">
            {activeOrders.map((o) => {
              const status = String(o.shc_status || 'pending');
              const dishName =
                (o.items as Array<{ name?: string; product_id?: string }>)?.[0]?.name || listCopy.fallbackDish;
              const productId = (o.items as Array<{ product_id?: string }>)?.[0]?.product_id;
              return (
                <GourmeatOrderRow
                  key={String(o.id)}
                  orderId={String(o.id)}
                  dishName={dishName}
                  productId={productId}
                  statusLabel={getLocalizedOrderStatus(locale, status)}
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
          <span className="font-semibold">{t('orders.loading')}</span>
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <GourmeatCard className="p-8 text-center">
          <SHCEmptyState
            title={t('orders.empty_title')}
            action={
              <GourmeatPrimaryButton
                label={t('orders.browse_link')}
                onClick={() => {
                  window.location.href = '/';
                }}
                className="mt-4"
                testID="orders-browse-btn"
              />
            }
          />
        </GourmeatCard>
      )}

      {pastOrders.length > 0 && (
        <h2 className="text-base font-extrabold text-foreground mb-3">{t('orders.past')}</h2>
      )}

      <div className="space-y-3">
        {pastOrders.map((o) => {
          const status = String(o.shc_status || 'pending');
          const dishName =
            (o.items as Array<{ name?: string; product_id?: string }>)?.[0]?.name || listCopy.fallbackDish;
          const productId = (o.items as Array<{ product_id?: string }>)?.[0]?.product_id;
          return (
            <GourmeatOrderRow
              key={String(o.id)}
              orderId={String(o.id)}
              dishName={dishName}
              productId={productId}
              statusLabel={getLocalizedOrderStatus(locale, status)}
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
