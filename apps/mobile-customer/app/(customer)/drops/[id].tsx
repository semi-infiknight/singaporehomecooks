/**
 * Cooking soon — add to cart → existing checkout (one-cook path).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GourmeatPrimaryButton, SHCFoodImage, SHCSkeletonBone, SHCSkeletonList, gourmeatColors, shcSpacing } from '@shc/ui';
import { formatDropCookDate, formatDropOrderBy, formatDropPrice, getDropImageUrl } from '@shc/utils';
import { useAuth } from '../../../hooks/useAuth';
import { useDrop, useAddDropToCart } from '../../../hooks/useOrder';

export default function DropOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dropId = String(id || '');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { data: drop, isLoading } = useDrop(dropId);
  const addMut = useAddDropToCart();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  const remaining = Number(drop?.remaining_qty ?? 0);
  const maxCan = Math.max(1, remaining || 1);
  const total = useMemo(() => {
    if (!drop) return 0;
    const unit = drop.price != null ? Number(drop.price) : Number(drop.price_cents || 0) / 100;
    return unit * qty;
  }, [drop, qty]);

  async function goCheckout() {
    setError('');
    if (!user) {
      router.push('/(shared)/auth' as any);
      return;
    }
    try {
      await addMut.mutateAsync({ id: dropId, qty });
      router.push('/(customer)/checkout' as any);
    } catch (e: any) {
      setError(e?.message || 'Could not add batch to cart');
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.wrap, { paddingTop: insets.top + 16 }]} testID="drop-order-skeleton">
        <SHCSkeletonBone height={22} width="55%" style={{ marginBottom: 12 }} />
        <SHCSkeletonBone height={16} width="80%" style={{ marginBottom: 8 }} />
        <SHCSkeletonBone height={14} width="45%" style={{ marginBottom: 16 }} />
        <SHCSkeletonList count={2} rowHeight={48} />
      </View>
    );
  }
  if (!drop) {
    return (
      <View style={[styles.wrap, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.muted}>Batch not found</Text>
      </View>
    );
  }

  const open = drop.status === 'open' && remaining > 0;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]} testID="drop-order-screen">
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <SHCFoodImage
        uri={getDropImageUrl({ title: drop.title, image_url: drop.image_url, cook_id: drop.cook_id })}
        height={160}
        rounded={16}
        testID="drop-order-hero"
      />
      <Text style={styles.eyebrow}>Cooking soon</Text>
      <Text style={styles.title} testID="drop-order-title">
        {drop.title}
      </Text>
      <Text style={styles.muted}>
        {drop.cook_name || 'Kitchen'} · {formatDropCookDate(drop.cook_date)} · {drop.collection_slot}
      </Text>
      <Text style={styles.price}>{formatDropPrice(drop.price_cents, drop.price)}</Text>
      <Text style={styles.muted}>
        {remaining} left · order by {formatDropOrderBy(drop.order_by)}
      </Text>
      {drop.note ? <Text style={[styles.muted, { marginTop: 8 }]}>{drop.note}</Text> : null}

      <View style={styles.qtyRow}>
        <Pressable testID="drop-qty-dec" onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={styles.qty} testID="drop-qty">
          {qty}
        </Text>
        <Pressable
          testID="drop-qty-inc"
          onPress={() => setQty((q) => Math.min(maxCan, q + 1))}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.total}>Total S${total.toFixed(2)}</Text>
      {!!error && (
        <Text style={styles.err} testID="drop-order-error">
          {error}
        </Text>
      )}
      <GourmeatPrimaryButton
        label={addMut.isPending ? 'Adding…' : open ? 'Continue to checkout' : 'Unavailable'}
        onPress={goCheckout}
        disabled={!open || addMut.isPending}
        testID="drop-order-submit"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: gourmeatColors.background, paddingHorizontal: shcSpacing.md },
  back: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: gourmeatColors.text },
  eyebrow: { fontSize: 11, fontWeight: '900', color: gourmeatColors.primary, textTransform: 'uppercase', marginTop: 12 },
  title: { fontSize: 24, fontWeight: '900', color: gourmeatColors.text, marginTop: 4 },
  muted: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textMuted, marginTop: 4 },
  price: { fontSize: 22, fontWeight: '900', color: gourmeatColors.primary, marginTop: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 8 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '800' },
  qty: { fontSize: 20, fontWeight: '900', minWidth: 28, textAlign: 'center' },
  total: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  err: { color: '#b91c1c', fontWeight: '700', marginBottom: 8 },
});
