import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useShcI18n, type ShcLocale } from '@shc/i18n';
import { gourmeatColors, shcBorders, shcRadii, shcSpacing } from '@shc/ui';

export function MobileLanguageSwitcher({ testID = 'language-switcher-mobile' }: { testID?: string }) {
  const { locale, setLocale, t } = useShcI18n();
  const options: { value: ShcLocale; label: string }[] = [
    { value: 'en', label: t('language.en') },
    { value: 'zh-Hans', label: t('language.zh') },
  ];

  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={styles.label}>{t('language.label')}</Text>
      <View style={styles.row}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setLocale(opt.value)}
            style={[styles.chip, locale === opt.value && styles.chipActive]}
            testID={`${testID}-${opt.value}`}
          >
            <Text style={[styles.chipText, locale === opt.value && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: shcSpacing.md },
  label: { fontSize: 12, fontWeight: '700', color: gourmeatColors.textLight, marginBottom: shcSpacing.xs },
  row: { flexDirection: 'row', gap: shcSpacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shcRadii.sm,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  chipActive: { backgroundColor: gourmeatColors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  chipTextActive: { color: '#fff' },
});
