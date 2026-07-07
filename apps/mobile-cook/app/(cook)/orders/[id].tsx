import React from 'react';
import { Text, TextInput, View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  OrderStatusBadge,
  SHCErrorBanner,
  gourmeatColors,
  shcSpacing,
  shcBorders,
  shcColors,
  shcShadows,
  useSHCTray,
  SHCTrayAction,
} from '@shc/ui';
import { useOrder, useTransitionOrder } from '../../../hooks/useOrder';
import { getOrderDisputes, submitOrderDispute } from '../../../lib/api-client';
import { SHCOrderStatus } from '@shc/types';
import { useShcI18n, getCookOrderTransitionActions, getCookOrderStatusLabel, getCookOrderDetailCopy } from '@shc/i18n';

function CookOrderDisputeTrayContent({
  onSubmit,
  isPending,
  copy,
}: {
  onSubmit: (notes: string) => void;
  isPending: boolean;
  copy: ReturnType<typeof getCookOrderDetailCopy>;
}) {
  const [disputeNotes, setDisputeNotes] = React.useState('');

  return (
    <View testID="cook-order-dispute-tray">
      <Text style={styles.hint}>{copy.disputeHint}</Text>
      <TextInput
        value={disputeNotes}
        onChangeText={setDisputeNotes}
        placeholder={copy.disputePlaceholder}
        placeholderTextColor={gourmeatColors.textMuted}
        multiline
        style={styles.disputeInput}
        testID="cook-dispute-notes-input"
      />
      <GourmeatPrimaryButton
        label={isPending ? copy.disputeSubmitting : copy.disputeSubmit}
        onPress={() => onSubmit(disputeNotes.trim())}
        disabled={isPending || disputeNotes.trim().length < 5}
        testID="cook-submit-dispute-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

export default function CookManageOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { locale } = useShcI18n();
  const copy = getCookOrderDetailCopy(locale);
  const { data: order } = useOrder(id || '');
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);
  const { openTray, dismiss } = useSHCTray();

  const nextActions = React.useMemo(() => {
    const actions = getCookOrderTransitionActions(locale);
    return Object.fromEntries(actions.map((a) => [a.status, [{ to: a.to, label: a.label }]])) as Record<
      string,
      { to: SHCOrderStatus; label: string }[]
    >;
  }, [locale]);

  const { data: disputes = [] } = useQuery({
    queryKey: ['order-disputes', id],
    queryFn: () => getOrderDisputes(id || ''),
    enabled: !!id,
    placeholderData: [],
  });

  const disputeMut = useMutation({
    mutationFn: (notes: string) => submitOrderDispute(id || '', { type: 'other', notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-disputes', id] });
      dismiss();
      openTray(
        { id: 'issue-reported', title: copy.trayReportedTitle, height: 'compact' },
        <SHCTrayAction
          message={copy.trayReportedBody}
          primaryLabel={copy.gotIt}
          onPrimary={dismiss}
          testID="cook-issue-reported-tray"
        />
      );
    },
    onError: (e: any) => {
      openTray(
        { id: 'issue-error', title: copy.trayErrorTitle, height: 'compact' },
        <SHCTrayAction message={e?.message || copy.trayErrorBody} primaryLabel={copy.ok} onPrimary={dismiss} />
      );
    },
  });

  const doTransition = async (to: SHCOrderStatus) => {
    if (!id) return;
    setErr(null);
    try {
      await transMut.mutateAsync({ orderId: id, to });
    } catch (e: any) {
      setErr({ message: e?.message || copy.transitionFailed });
    }
  };

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayAction
        message={copy.confirmMessage.replace('{label}', label)}
        primaryLabel={label}
        onPrimary={() => {
          dismiss();
          doTransition(to);
        }}
        secondaryLabel={copy.cancel}
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  const openDisputeTray = () => {
    openTray({ id: 'cook-order-dispute', title: copy.reportIssue, height: 'medium' }, () => (
      <CookOrderDisputeTrayContent
        onSubmit={(notes) => disputeMut.mutate(notes)}
        isPending={disputeMut.isPending}
        copy={copy}
      />
    ));
  };

  if (!order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: gourmeatColors.textLight }}>{copy.loading}</Text>
      </View>
    );
  }

  const actions = nextActions[order.shc_status] || [];
  const dishName = order.items?.[0]?.name;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: 100 }}
      testID="cook-order-detail-screen"
    >
      <GourmeatScreenHeader
        title={copy.orderTitle(String(order.id), dishName)}
        subtitle={getCookOrderStatusLabel(locale, String(order.shc_status || ''))}
        onBack={() => router.back()}
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      <OrderStatusBadge status={order.shc_status} />

      <GourmeatCard appearance="cook">
        <Text style={styles.cardTitle}>{copy.collection}</Text>
        <Text style={styles.cardBody}>
          {order.collection_date} · {order.collection_slot}
        </Text>
        <Text style={styles.cardMeta}>
          {copy.itemsMeta.replace('{total}', String(order.total)).replace('{count}', String(order.items?.length || 1))}
        </Text>
        {(order.items || []).map((it: any, i: number) => (
          <Text key={i} style={styles.itemLine}>
            {copy.itemLine(it.qty || 1, it.name || '')}
          </Text>
        ))}
        <Text style={styles.hint}>{copy.hint}</Text>
      </GourmeatCard>

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <GourmeatPrimaryButton
              key={a.to}
              label={transMut.isPending ? copy.updating : a.label}
              onPress={() => confirmTransition(a.to, a.label)}
              disabled={transMut.isPending}
              testID={`cook-order-transition-${a.to}`}
            />
          ))}
        </View>
      )}

      <GourmeatPrimaryButton
        label={copy.chat}
        variant="outline"
        onPress={() => router.push(`/(shared)/chat/${order.id}` as any)}
        testID="cook-order-chat-btn"
      />

      {disputes.length > 0 ? (
        <GourmeatCard appearance="cook" testID="cook-order-dispute-submitted">
          <Text style={styles.cardTitle}>{copy.issueReported}</Text>
          <Text style={styles.cardMeta}>
            {disputes[0].status === 'open' ? copy.disputeOpen : disputes[0].status || copy.disputeOpen} ·{' '}
            {disputes[0].type || copy.disputeOther}
          </Text>
          {!!disputes[0].notes && <Text style={styles.cardBody}>{disputes[0].notes}</Text>}
        </GourmeatCard>
      ) : (
        <GourmeatPrimaryButton
          label={copy.reportIssue}
          variant="outline"
          onPress={openDisputeTray}
          testID="cook-open-dispute-tray-btn"
        />
      )}

      <Text style={styles.footer}>{copy.footer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight },
  itemLine: { marginTop: 4, fontSize: 13, color: gourmeatColors.text },
  hint: { marginTop: shcSpacing.sm, fontSize: 12, color: gourmeatColors.textLight, lineHeight: 18 },
  actions: { gap: 8, marginTop: shcSpacing.md, marginBottom: shcSpacing.sm },
  disputeInput: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: 12,
    padding: 10,
    marginTop: shcSpacing.sm,
    minHeight: 76,
    backgroundColor: gourmeatColors.surfaceAlt,
    color: gourmeatColors.text,
    ...shcShadows.brutalSm,
  },
  footer: { fontSize: 11, marginTop: shcSpacing.md, color: gourmeatColors.textMuted },
});
