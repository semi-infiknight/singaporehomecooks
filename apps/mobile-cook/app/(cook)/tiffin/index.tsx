/**
 * Cook tiffin OS — config + day menu publish / cancel (wave 3).
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  Switch,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinCookDishToggle,
  GourmeatPrimaryButton,
  SHCSkeletonList,
  gourmeatColors,
  shcSpacing,
  TIFFIN_DAY_LABELS,
  contentPadForTabBar,
} from '@shc/ui';
import {
  cookOpsCollectionDates,
  cookTiffinMetrics,
  cookMenuPublishSuccessCopy,
  cookDayCancelSuccessCopy,
  cookTiffinEmptyDishesCopy,
  DEFAULT_TIFFIN_PRICING_BY_MEALS,
  COOK_TIFFIN_COLLECTION_SLOTS,
  TIFFIN_MEALS_PER_WEEK_CHOICES,
  normalizeTiffinMealsPerWeekOptions,
  toggleTiffinMealsPerWeekOption,
  normalizeTiffinDefaultCollectionSlot,
} from '@shc/utils';
import {
  useTiffinCookConfig,
  useUpdateTiffinCookConfig,
  useKitchenCancelTiffinDay,
  usePublishTiffinDayMenu,
} from '../../../hooks/useTiffin';
import { useCookListings } from '../../../hooks/useProducts';

export default function CookTiffinConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: configData, isLoading } = useTiffinCookConfig();
  const { data: listings = [] } = useCookListings();
  const updateMut = useUpdateTiffinCookConfig();
  const cancelDayMut = useKitchenCancelTiffinDay();
  const publishMenuMut = usePublishTiffinDayMenu();

  const config = (configData as any)?.config;
  const [enabled, setEnabled] = useState(false);
  const [tagline, setTagline] = useState('');
  const [eligible, setEligible] = useState<string[]>([]);
  const [collectionDays, setCollectionDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pricing, setPricing] = useState<Record<string, string>>({
    '2': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['2']),
    '3': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['3']),
    '4': String(DEFAULT_TIFFIN_PRICING_BY_MEALS['4']),
  });
  const [mealsPerWeekOptions, setMealsPerWeekOptions] = useState<number[]>([2, 3, 4]);
  const [defaultCollectionSlot, setDefaultCollectionSlot] = useState('18:00-19:00');
  const [selectedDate, setSelectedDate] = useState('');
  const [opsMsg, setOpsMsg] = useState('');
  const [opsError, setOpsError] = useState('');

  useEffect(() => {
    if (config) {
      setEnabled(!!config.enabled);
      setTagline(config.tagline || '');
      setEligible(config.eligible_product_ids || []);
      setCollectionDays(config.collection_days || [1, 2, 3, 4, 5]);
      const p = config.pricing_by_meals_per_week || DEFAULT_TIFFIN_PRICING_BY_MEALS;
      setPricing({
        '2': String(p['2'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['2']),
        '3': String(p['3'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['3']),
        '4': String(p['4'] ?? DEFAULT_TIFFIN_PRICING_BY_MEALS['4']),
      });
      setMealsPerWeekOptions(normalizeTiffinMealsPerWeekOptions(config.meals_per_week_options));
      setDefaultCollectionSlot(normalizeTiffinDefaultCollectionSlot(config.default_collection_slot));
    }
  }, [config]);

  const dishes = listings.map((l: any) => ({
    id: l.id || l.product_id,
    name: l.name || l.title,
    price: l.price,
    cuisine: l.cuisine,
  }));

  const metrics = useMemo(
    () =>
      cookTiffinMetrics({
        enabled,
        eligibleProductIds: eligible,
        collectionDays,
        subscriberCount: (configData as any)?.subscriber_count,
      }),
    [enabled, eligible, collectionDays, configData]
  );

  const opsDays = useMemo(
    () => cookOpsCollectionDates({ collectionDays, count: 7 }),
    [collectionDays]
  );

  useEffect(() => {
    if (!selectedDate && opsDays[0]) setSelectedDate(opsDays[0].date);
  }, [opsDays, selectedDate]);

  const toggleDish = (id: string) => {
    setEligible((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDay = (day: number) => {
    setCollectionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    await updateMut.mutateAsync({
      enabled,
      tagline: tagline.trim() || undefined,
      eligible_product_ids: eligible,
      collection_days: collectionDays,
      meals_per_week_options: normalizeTiffinMealsPerWeekOptions(mealsPerWeekOptions) as (2 | 3 | 4)[],
      default_collection_slot: normalizeTiffinDefaultCollectionSlot(defaultCollectionSlot),
      pricing_by_meals_per_week: {
        '2': Number(pricing['2']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['2'],
        '3': Number(pricing['3']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['3'],
        '4': Number(pricing['4']) || DEFAULT_TIFFIN_PRICING_BY_MEALS['4'],
      },
    });
    router.back();
  };

  const handlePublish = async () => {
    setOpsError('');
    setOpsMsg('');
    if (!selectedDate) return;
    if (eligible.length === 0) {
      setOpsError('Select at least one eligible dish before publishing.');
      return;
    }
    try {
      await publishMenuMut.mutateAsync({
        collectionDate: selectedDate,
        productIds: eligible,
        note: 'Daily tiffin menu',
      });
      setOpsMsg(cookMenuPublishSuccessCopy(selectedDate, eligible.length));
    } catch (e: any) {
      setOpsError(e?.message || 'Publish failed');
    }
  };

  const handleCancelDay = async () => {
    setOpsError('');
    setOpsMsg('');
    if (!selectedDate) return;
    try {
      await cancelDayMut.mutateAsync({
        collectionDate: selectedDate,
        reason: 'Kitchen unavailable',
      });
      setOpsMsg(cookDayCancelSuccessCopy(selectedDate));
    } catch (e: any) {
      setOpsError(e?.message || 'Cancel day failed');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={5} rowHeight={64} />
      </View>
    );
  }

  const emptyDishes = cookTiffinEmptyDishesCopy();

  return (
    <View style={styles.screen} testID="cook-tiffin-config-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: contentPadForTabBar(insets.bottom),
        }}
      >
        <GourmeatScreenHeader
          title="Tiffin kitchen OS"
          subtitle="Visibility · dishes · publish / cancel day"
          onBack={() => router.back()}
        />

        <View style={styles.metrics} testID="cook-tiffin-metrics">
          <Text style={styles.metricsTitle}>{metrics.statusLabel}</Text>
          <Text style={styles.metricsDetail}>{metrics.statusDetail}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>{metrics.eligibleCount}</Text>
              <Text style={styles.metricLabel}>Dishes</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>{metrics.collectionDayCount}</Text>
              <Text style={styles.metricLabel}>Days</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>
                {metrics.subscriberCount != null ? metrics.subscriberCount : '—'}
              </Text>
              <Text style={styles.metricLabel}>Subs</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Visible to customers</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            testID="cook-tiffin-enabled-switch"
          />
        </View>

        <Text style={styles.label}>Tagline</Text>
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="e.g. Peranakan comfort — 3 nights a week"
          placeholderTextColor={gourmeatColors.textMuted}
          testID="cook-tiffin-tagline-input"
        />

        <Text style={styles.sectionTitle}>Plan pricing (S$ per meal)</Text>
        <Text style={styles.hint}>Customers see these rates when subscribing to your tiffin plan.</Text>
        <View style={styles.pricingRow}>
          {(['2', '3', '4'] as const).map((tier) => (
            <View key={tier} style={styles.pricingCell}>
              <Text style={styles.pricingLabel}>{tier} meals/wk</Text>
              <TextInput
                style={styles.pricingInput}
                value={pricing[tier]}
                onChangeText={(v) => setPricing((prev) => ({ ...prev, [tier]: v }))}
                keyboardType="decimal-pad"
                testID={`cook-tiffin-price-${tier}`}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Collection days</Text>
        <View style={styles.dayRow}>
          {TIFFIN_DAY_LABELS.map((label, day) => (
            <GourmeatPrimaryButton
              key={day}
              label={label}
              variant={collectionDays.includes(day) ? 'primary' : 'outline'}
              onPress={() => toggleDay(day)}
              testID={`cook-tiffin-day-${day}`}
              style={{ flex: 1, minWidth: 40, paddingHorizontal: 4 }}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Meals per week tiers</Text>
        <Text style={styles.hint}>Choose which plan sizes customers can subscribe to (at least one).</Text>
        <View style={styles.dayRow}>
          {TIFFIN_MEALS_PER_WEEK_CHOICES.map((n) => (
            <GourmeatPrimaryButton
              key={n}
              label={`${n}/wk`}
              variant={mealsPerWeekOptions.includes(n) ? 'primary' : 'outline'}
              onPress={() =>
                setMealsPerWeekOptions((prev) => toggleTiffinMealsPerWeekOption(prev, n))
              }
              testID={`cook-tiffin-meals-${n}`}
              style={{ flex: 1, minWidth: 56, paddingHorizontal: 4 }}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Default collection slot</Text>
        <Text style={styles.hint}>Used for weekly meal cards when no day-specific slot is set.</Text>
        {COOK_TIFFIN_COLLECTION_SLOTS.map((slot) => (
          <GourmeatPrimaryButton
            key={slot.id}
            label={slot.label}
            variant={defaultCollectionSlot === slot.id ? 'primary' : 'outline'}
            onPress={() => setDefaultCollectionSlot(slot.id)}
            testID={`cook-tiffin-slot-${slot.id}`}
            style={{ marginBottom: shcSpacing.xs }}
          />
        ))}

        <Text style={styles.sectionTitle}>Eligible dishes</Text>
        <Text style={styles.hint}>Select listings customers can pick in their weekly plan.</Text>
        {dishes.length === 0 ? (
          <View testID="cook-tiffin-empty-dishes" style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{emptyDishes.title}</Text>
            <Text style={styles.hint}>{emptyDishes.body}</Text>
            <GourmeatPrimaryButton
              label={emptyDishes.ctaLabel}
              onPress={() => router.push('/(cook)/listings' as any)}
              style={{ marginTop: shcSpacing.sm }}
            />
          </View>
        ) : (
          dishes.map((d: { id: string; name: string; price?: number; cuisine?: string }) => (
            <SHCTiffinCookDishToggle
              key={d.id}
              dish={d}
              enabled={eligible.includes(d.id)}
              onToggle={() => toggleDish(d.id)}
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Day menu & cancel</Text>
        <Text style={styles.hint}>
          Pick a collection date, publish the menu, or cancel the kitchen day.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.opsScroll}>
          {opsDays.map((d) => {
            const on = d.date === selectedDate;
            return (
              <Pressable
                key={d.date}
                onPress={() => setSelectedDate(d.date)}
                style={[styles.opsChip, on && styles.opsChipOn]}
                testID={`cook-ops-date-${d.date}`}
              >
                <Text style={[styles.opsChipDay, on && styles.opsChipTextOn]}>{d.shortLabel}</Text>
                <Text style={[styles.opsChipDate, on && styles.opsChipTextOn]}>{d.date.slice(5)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <GourmeatPrimaryButton
          label={
            publishMenuMut.isPending
              ? 'Publishing…'
              : `Publish menu · ${selectedDate || 'pick day'}`
          }
          onPress={handlePublish}
          loading={publishMenuMut.isPending}
          testID="cook-tiffin-publish-menu-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label={
            cancelDayMut.isPending
              ? 'Canceling…'
              : `Cancel kitchen day · ${selectedDate || 'pick day'}`
          }
          variant="outline"
          onPress={handleCancelDay}
          loading={cancelDayMut.isPending}
          testID="cook-tiffin-cancel-day-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        {opsMsg ? (
          <Text style={styles.okMsg} testID="cook-tiffin-ops-msg">
            {opsMsg}
          </Text>
        ) : null}
        {opsError ? (
          <Text style={styles.errMsg} testID="cook-tiffin-ops-error">
            {opsError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
        <GourmeatPrimaryButton
          label="Save tiffin settings"
          onPress={handleSave}
          loading={updateMut.isPending}
          testID="cook-tiffin-save-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metrics: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
  },
  metricsTitle: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  metricsDetail: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4 },
  metricsRow: { flexDirection: 'row', marginTop: shcSpacing.sm },
  metricCell: { flex: 1, alignItems: 'center' },
  metricNum: { fontSize: 20, fontWeight: '900', color: gourmeatColors.primary },
  metricLabel: { fontSize: 10, fontWeight: '700', color: gourmeatColors.textLight, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: shcSpacing.md,
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: gourmeatColors.text },
  label: { fontSize: 13, fontWeight: '700', color: gourmeatColors.text, marginBottom: shcSpacing.xs },
  input: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 10,
    padding: shcSpacing.md,
    fontSize: 14,
    color: gourmeatColors.text,
    marginBottom: shcSpacing.md,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginTop: shcSpacing.md },
  hint: { fontSize: 12, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  pricingRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  pricingCell: { flex: 1 },
  pricingLabel: { fontSize: 11, fontWeight: '700', color: gourmeatColors.textLight, marginBottom: 4 },
  pricingInput: {
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: 10,
    padding: shcSpacing.sm,
    fontSize: 16,
    fontWeight: '800',
    color: gourmeatColors.text,
    backgroundColor: gourmeatColors.surface,
  },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: shcSpacing.sm },
  opsScroll: { marginVertical: shcSpacing.sm, maxHeight: 72 },
  opsChip: {
    width: 64,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
    paddingVertical: 8,
    alignItems: 'center',
  },
  opsChipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  opsChipDay: { fontSize: 10, fontWeight: '800', color: gourmeatColors.textLight },
  opsChipDate: { fontSize: 12, fontWeight: '900', color: gourmeatColors.text, marginTop: 2 },
  opsChipTextOn: { color: '#fff' },
  emptyBox: {
    padding: shcSpacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
    marginBottom: shcSpacing.md,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginBottom: 4 },
  okMsg: { marginTop: shcSpacing.sm, fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  errMsg: { marginTop: shcSpacing.sm, fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
});
