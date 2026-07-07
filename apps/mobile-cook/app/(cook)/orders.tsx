import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCookHeader,
  GourmeatOrderRow,
  GourmeatPrimaryButton,
  GourmeatCard,
  GourmeatEmptyState,
  SHCErrorBanner,
  SHCFadeIn,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { useShcI18n, getCookOrderTransitionActions, getCookOrderStatusLabel, getCookOrderDetailCopy } from '@shc/i18n';

import { useMyOrders, useTransitionOrder } from '../../hooks/useOrder';
import { useAuth } from '../../hooks/useAuth';
import { SHCOrderStatus } from '@shc/types';

export default function CookOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, locale } = useShcI18n();
  const orderCopy = getCookOrderDetailCopy(locale);
  const { data: orders = [] } = useMyOrders();
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);

  const nextActions = React.useMemo(() => {
    const actions = getCookOrderTransitionActions(locale);
    return Object.fromEntries(actions.map((a) => [a.status, [{ to: a.to, label: a.label }]])) as Record<
      string,
      { to: SHCOrderStatus; label: string }[]
    >;
  }, [locale]);

  const doTransition = async (orderId: string, to: SHCOrderStatus) => {
    setErr(null);
    try {
      await transMut.mutateAsync({ orderId, to });
    } catch (e: any) {
      setErr({ message: e?.message || orderCopy.transitionFailed });
    }
  };

  const pendingCount = orders.filter((o: any) => !['collected', 'completed'].includes(o.shc_status)).length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-orders-screen"
    >
      <GourmeatCookHeader
        title={t('cook.orders.title')}
        subtitle={user?.name}
        badges={
          pendingCount > 0 ? (
            <Text style={{ fontSize: 11, fontWeight: '700', color: gourmeatColors.primary, backgroundColor: gourmeatColors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              {t('cook.orders.active_badge').replace('{count}', String(pendingCount))}
            </Text>
          ) : undefined
        }
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      {orders.length === 0 && (
        <GourmeatCard>
          <GourmeatEmptyState title={t('cook.orders.empty_title')} body={t('cook.orders.empty_body')} />
        </GourmeatCard>
      )}

      <SHCFadeIn delay={80}>
      {orders.map((o: any) => {
        const actions = nextActions[o.shc_status] || [];
        const dishName = o.items?.[0]?.name;
        return (
          <GourmeatOrderRow
            key={o.id}
            orderId={o.id}
            dishName={dishName}
            productId={o.items?.[0]?.product_id}
            status={o.shc_status}
            statusLabel={getCookOrderStatusLabel(locale, String(o.shc_status || ''))}
            collectionDate={o.collection_date}
            collectionSlot={o.collection_slot}
            total={o.total}
            onPress={() => router.push(`/(cook)/orders/${o.id}` as any)}
            testID={`cook-order-row-${o.id}`}
            actions={
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {actions.map((a, idx) => (
                  <GourmeatPrimaryButton key={idx} label={a.label} onPress={() => doTransition(o.id, a.to)} style={{ paddingVertical: 8, paddingHorizontal: 12, minWidth: 80 }} />
                ))}
                <Link href={`/(shared)/chat/${o.id}` as any} style={styles.actionLink}>
                  <Text style={styles.actionLinkText}>{t('cook.orders.chat')}</Text>
                </Link>
                <Link href={`/(cook)/orders/${o.id}` as any} style={styles.actionLink}>
                  <Text style={styles.actionLinkText}>{t('cook.orders.details')}</Text>
                </Link>
              </View>
            }
          />
        );
      })}
      </SHCFadeIn>

      <Link href="/(cook)/listings" asChild>
        <Pressable style={styles.listingsBtn}>
          <Text style={styles.listingsBtnText}>{t('cook.orders.manage_listings')}</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  listingsBtn: { marginTop: shcSpacing.md, backgroundColor: gourmeatColors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  listingsBtnText: { color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 15 },
  actionLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  actionLinkText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.text },
});