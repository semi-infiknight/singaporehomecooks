/**
 * Cook: post & manage Cooking soon batches.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GourmeatCookHeader, GourmeatPrimaryButton, SHCFoodImage, SHCSkeletonList, gourmeatColors, shcSpacing } from '@shc/ui';
import {
  defaultCookDateTomorrow,
  defaultOrderByTonight,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  getDropImageUrl,
} from '@shc/utils';
import { listMyDrops, createDrop, patchDrop } from '../../lib/api-client';
import { useAuth } from '../../hooks/useAuth';

export default function CookBatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const dropsQ = useQuery({
    queryKey: ['cook-drops'],
    queryFn: listMyDrops,
  });
  const dropList = (dropsQ.data as any[]) ?? [];
  const dropsLoading = dropsQ.isLoading;
  const createMut = useMutation({
    mutationFn: createDrop,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-drops'] }),
  });
  const patchMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => patchDrop(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-drops'] }),
  });

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [price, setPrice] = useState('1.20');
  const [maxQty, setMaxQty] = useState('40');
  const [minQty, setMinQty] = useState('10');
  const [error, setError] = useState('');

  async function onCreate() {
    setError('');
    if (title.trim().length < 2) {
      setError('Add a dish name');
      return;
    }
    try {
      await createMut.mutateAsync({
        title: title.trim(),
        note: note.trim() || undefined,
        price: Number(price),
        max_qty: Number(maxQty) || 1,
        min_qty: Number(minQty) || 0,
        cook_date: defaultCookDateTomorrow(),
        collection_slot: '18:00-19:00',
        order_by: defaultOrderByTonight(10),
        visibility: 'marketplace',
      });
      setTitle('');
      setNote('');
      Alert.alert('Posted', 'Your batch is live on Cooking soon.');
    } catch (e: any) {
      setError(e?.message || 'Could not post batch');
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: gourmeatColors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: shcSpacing.md }}
      testID="cook-batches-screen"
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Dashboard</Text>
      </Pressable>
      <GourmeatCookHeader
        title="Cooking soon"
        subtitle={`${user?.name || 'Kitchen'} · Post a batch`}
        testID="cook-batches-hero"
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Post a batch</Text>
        <TextInput
          style={styles.input}
          placeholder="Dish name (e.g. Samosas)"
          value={title}
          onChangeText={setTitle}
          testID="batch-title"
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
          testID="batch-note"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Price S$"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            testID="batch-price"
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Max qty"
            keyboardType="number-pad"
            value={maxQty}
            onChangeText={setMaxQty}
            testID="batch-max"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Min to fire"
          keyboardType="number-pad"
          value={minQty}
          onChangeText={setMinQty}
          testID="batch-min"
        />
        {!!error && <Text style={styles.err}>{error}</Text>}
        <GourmeatPrimaryButton
          label={createMut.isPending ? 'Posting…' : 'Post to marketplace'}
          onPress={onCreate}
          disabled={createMut.isPending}
          testID="batch-submit"
        />
      </View>

      <Text style={styles.section}>My batches</Text>
      {dropsLoading && dropList.length === 0 ? <SHCSkeletonList count={3} rowHeight={96} /> : null}
      {!dropsLoading && dropList.length === 0 && (
        <Text style={styles.muted}>No batches yet.</Text>
      )}
      {dropList.map((d) => (
        <View key={d.id} style={styles.card} testID={`cook-batch-${d.id}`}>
          <SHCFoodImage
            uri={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: user?.id })}
            height={120}
            rounded={12}
            testID={`cook-batch-img-${d.id}`}
          />
          <Text style={[styles.cardTitle, { marginTop: 10 }]}>{d.title}</Text>
          <Text style={styles.muted}>
            {formatDropCookDate(d.cook_date)} · {d.collection_slot} · by {formatDropOrderBy(d.order_by)}
          </Text>
          <Text style={styles.price}>
            {formatDropPrice(d.price_cents, d.price)} · {d.ordered_qty}/{d.max_qty}
          </Text>
          <Text style={styles.badge}>{String(d.status).replace(/_/g, ' ')}</Text>
          {d.status === 'open' && (
            <View style={styles.row}>
              <Pressable
                style={styles.secondary}
                onPress={() => patchMut.mutate({ id: d.id, input: { status: 'paused' } })}
              >
                <Text style={styles.secondaryText}>Pause</Text>
              </Pressable>
              <Pressable
                style={styles.secondary}
                onPress={() => patchMut.mutate({ id: d.id, input: { status: 'closed' } })}
              >
                <Text style={styles.secondaryText}>End</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { fontWeight: '800', marginBottom: 8, color: gourmeatColors.text },
  card: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: gourmeatColors.surface,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: gourmeatColors.text },
  input: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  half: { flex: 1 },
  err: { color: '#b91c1c', fontWeight: '700', marginTop: 8 },
  section: { fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 8 },
  muted: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4 },
  price: { fontSize: 14, fontWeight: '800', color: gourmeatColors.primary, marginTop: 6 },
  badge: { marginTop: 6, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  secondary: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
  },
  secondaryText: { fontWeight: '800', fontSize: 13 },
});
