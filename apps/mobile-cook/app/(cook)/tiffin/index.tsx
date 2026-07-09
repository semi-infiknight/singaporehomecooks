import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, Switch, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinCookDishToggle,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
  TIFFIN_DAY_LABELS,
} from '@shc/ui';
import { useTiffinCookConfig, useUpdateTiffinCookConfig } from '../../../hooks/useTiffin';
import { useCookListings } from '../../../hooks/useProducts';

export default function CookTiffinConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: configData, isLoading } = useTiffinCookConfig();
  const { data: listings = [] } = useCookListings();
  const updateMut = useUpdateTiffinCookConfig();

  const config = (configData as any)?.config;
  const [enabled, setEnabled] = useState(false);
  const [tagline, setTagline] = useState('');
  const [eligible, setEligible] = useState<string[]>([]);
  const [collectionDays, setCollectionDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (config) {
      setEnabled(!!config.enabled);
      setTagline(config.tagline || '');
      setEligible(config.eligible_product_ids || []);
      setCollectionDays(config.collection_days || [1, 2, 3, 4, 5]);
    }
  }, [config]);

  const dishes = listings.map((l: any) => ({
    id: l.id || l.product_id,
    name: l.name || l.title,
    price: l.price,
    cuisine: l.cuisine,
  }));

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
      meals_per_week_options: [2, 3, 4],
    });
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="cook-tiffin-config-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <GourmeatScreenHeader
          title="Tiffin subscription"
          subtitle="Let customers subscribe to weekly meals from your kitchen"
          onBack={() => router.back()}
        />

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

        <Text style={styles.sectionTitle}>Eligible dishes</Text>
        <Text style={styles.hint}>Select precooked listings customers can pick in their weekly plan.</Text>
        {dishes.map((d: { id: string; name: string; price?: number; cuisine?: string }) => (
          <SHCTiffinCookDishToggle
            key={d.id}
            dish={d}
            enabled={eligible.includes(d.id)}
            onToggle={() => toggleDish(d.id)}
          />
        ))}
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: shcSpacing.md },
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
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: shcSpacing.sm },
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