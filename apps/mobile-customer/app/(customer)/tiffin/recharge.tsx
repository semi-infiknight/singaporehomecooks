/**
 * Recharge plan — weeks → HitPay PayNow → webhook extends plan.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  GourmeatPrimaryButton,
  GourmeatCard,
  gourmeatColors,
  shcSpacing,
  tiffinWeeklySubtotal,
  SHCSkeletonList,
  PayNowPanel,
  contentPadSafe,
} from '@shc/ui';
import {
  rechargeWeekOptions,
  applyRecharge,
  defaultFlexQuota,
  tiffinRechargeAmountCents,
} from '@shc/business-rules';
import { useTiffinSubscription } from '../../../hooks/useTiffin';
import { createTiffinRechargePayNow } from '../../../lib/api-client';

export default function TiffinRechargeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading, refetch } = useTiffinSubscription();
  const [weeks, setWeeks] = useState(4);
  const [phase, setPhase] = useState<'pick' | 'paynow' | 'done'>('pick');
  const [error, setError] = useState('');
  const [paySession, setPaySession] = useState<Awaited<ReturnType<typeof createTiffinRechargePayNow>> | null>(
    null
  );
  const [paySessionLoading, setPaySessionLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const expiresBeforeRef = useRef<string | null>(null);
  const paySessionWeeksRef = useRef<number | null>(null);

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const amountCents = useMemo(
    () => (sub ? tiffinRechargeAmountCents(sub.meals_per_week, weeks) : 0),
    [sub, weeks]
  );
  const amountDollars = amountCents / 100;
  const defaultRef = `TIFFIN-${String(sub?.id || 'PLAN').slice(-8)}-${weeks}W`;

  const loadPayNowSession = useCallback(async (force = false) => {
    if (!force && paySessionWeeksRef.current === weeks) return;
    paySessionWeeksRef.current = weeks;
    setPaySessionLoading(true);
    setError('');
    try {
      const s = await createTiffinRechargePayNow(weeks);
      setPaySession(s);
      if (s.provider === 'hitpay') setWaitingForPayment(true);
    } catch (e: any) {
      paySessionWeeksRef.current = null;
      setPaySession({
        provider: 'hitpay_error',
        error: e?.message || 'Could not create PayNow QR',
      } as any);
    } finally {
      setPaySessionLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    if (phase !== 'paynow') {
      paySessionWeeksRef.current = null;
      return;
    }
    void loadPayNowSession();
  }, [phase, loadPayNowSession]);

  useEffect(() => {
    if (phase !== 'paynow' || !waitingForPayment) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await refetch();
        const newExp = (fresh.data as any)?.subscription?.expires_on;
        if (newExp && expiresBeforeRef.current && newExp !== expiresBeforeRef.current) {
          if (cancelled) return;
          setWaitingForPayment(false);
          setPhase('done');
          setTimeout(() => router.replace('/(customer)/tiffin/manage' as any), 900);
        }
      } catch {
        /* keep polling */
      }
    };
    void tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, waitingForPayment, refetch, router]);

  if (isLoading && !sub) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: shcSpacing.md, width: '100%' }]}>
        <SHCSkeletonList count={3} rowHeight={88} />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={[styles.screen, { padding: shcSpacing.lg, paddingTop: insets.top + 24 }]}>
        <GourmeatScreenHeader title="Recharge plan" subtitle="No active subscription" onBack={() => router.back()} />
        <GourmeatPrimaryButton label="Browse kitchens" onPress={() => router.replace('/(customer)/tiffin' as any)} />
      </View>
    );
  }

  const preview = applyRecharge({
    mealsPerWeek: sub.meals_per_week,
    weeks,
    flexQuota: sub.flex_quota ?? defaultFlexQuota(sub.meals_per_week),
    flexRemaining: sub.flex_remaining ?? 0,
    deliveriesLeft: sub.deliveries_left ?? 0,
    expiresOn: sub.expires_on,
  });

  if (phase === 'done') {
    return (
      <View style={[styles.centered, { padding: shcSpacing.lg }]} testID="tiffin-recharge-done">
        <Text style={styles.doneMark}>✓</Text>
        <Text style={styles.bold}>Recharge recorded</Text>
        <Text style={styles.meta}>+{preview.mealsAdded} meals · ledger updated</Text>
        <GourmeatPrimaryButton
          label="Back to manage"
          onPress={() => router.replace('/(customer)/tiffin/manage' as any)}
          style={{ marginTop: shcSpacing.lg }}
        />
      </View>
    );
  }

  if (phase === 'paynow') {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: contentPadSafe(insets.bottom),
        }}
        testID="tiffin-recharge-paynow"
      >
        <GourmeatScreenHeader
          title="PayNow recharge"
          subtitle={`${weeks} week${weeks > 1 ? 's' : ''} · S$${amountDollars.toFixed(2)}`}
          onBack={() => setPhase('pick')}
        />
        <PayNowPanel
          orderId={paySession?.reference || defaultRef}
          total={amountDollars}
          session={paySession}
          loadingSession={paySessionLoading}
          onRetry={() => void loadPayNowSession(true)}
          waitingForPayment={waitingForPayment}
        />
        <Text style={[styles.meta, { marginTop: 12 }]}>
          Scan to pay · we confirm via HitPay · plan extends after payment.
        </Text>
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: contentPadSafe(insets.bottom),
      }}
      testID="tiffin-recharge-screen"
    >
      <GourmeatScreenHeader
        title="Recharge plan"
        subtitle={kitchen?.cook?.display_name || 'Kitchen'}
        onBack={() => router.back()}
      />

      <GourmeatCard>
        <Text style={styles.meta}>
          {sub.meals_per_week} meals/wk · exp {sub.expires_on?.slice?.(0, 10) || '—'}
        </Text>
        <Text style={styles.meta}>
          Deliveries {sub.deliveries_left ?? '—'} · Flex {sub.flex_remaining ?? '—'}/{sub.flex_quota ?? '—'}
          {sub.balance_cents != null
            ? ` · Wallet S$${(Number(sub.balance_cents) / 100).toFixed(2)}`
            : ''}
        </Text>
      </GourmeatCard>

      <Text style={styles.section}>How many weeks?</Text>
      <View style={styles.row} testID="recharge-weeks-picker">
        {rechargeWeekOptions().map((w) => {
          const on = weeks === w;
          return (
            <Pressable
              key={w}
              onPress={() => setWeeks(w)}
              style={[styles.chip, on && styles.chipOn]}
              testID={`recharge-weeks-${w}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{w} wk</Text>
            </Pressable>
          );
        })}
      </View>

      <GourmeatCard style={{ marginTop: shcSpacing.md }}>
        <Text style={styles.bold}>After recharge</Text>
        <Text style={styles.meta}>+{preview.mealsAdded} meals · flex {preview.flexRemaining}</Text>
        <Text style={styles.meta}>Expiry {preview.expiresOn}</Text>
        <Text style={styles.price}>
          S${amountDollars.toFixed(2)} · ~S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk
        </Text>
      </GourmeatCard>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <GourmeatPrimaryButton
        label={`Continue to PayNow · S$${amountDollars.toFixed(2)}`}
        onPress={() => {
          setError('');
          expiresBeforeRef.current = sub.expires_on || null;
          setPhase('paynow');
        }}
        testID="recharge-continue-paynow"
        style={{ marginTop: shcSpacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gourmeatColors.background,
  },
  section: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: shcSpacing.md,
    marginBottom: shcSpacing.sm,
    color: gourmeatColors.text,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
  },
  chipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  chipText: { fontWeight: '900', color: gourmeatColors.text },
  chipTextOn: { color: '#fff' },
  meta: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4 },
  bold: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  price: { fontSize: 16, fontWeight: '900', color: gourmeatColors.primary, marginTop: 8 },
  err: { color: '#B91C1C', fontWeight: '700', marginTop: 12 },
  doneMark: { fontSize: 40, color: '#2E7D32', marginBottom: 12 },
});
