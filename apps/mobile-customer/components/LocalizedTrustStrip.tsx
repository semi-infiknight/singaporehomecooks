import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SHCTrustStrip } from '@shc/ui';
import { LAUNCH_PLATFORM_COUNTERS, type PlatformCounters } from '@shc/utils';
import { formatTrustStripCopy, useShcI18n } from '@shc/i18n';

/** Localized trust strip wrapper for mobile screens (tri-platform i18n). */
export function LocalizedTrustStrip({
  counters,
  testID = 'trust-strip',
}: {
  counters?: PlatformCounters;
  testID?: string;
}) {
  const { locale } = useShcI18n();
  const data = counters ?? LAUNCH_PLATFORM_COUNTERS;
  const items = useMemo(() => {
    const copy = formatTrustStripCopy(locale, data);
    return [
      { iconKey: 'discover' as const, label: copy.cooksLabel, sub: copy.cooksSub },
      { iconKey: 'orders' as const, label: copy.mealsLabel, sub: copy.mealsSub },
      { iconKey: 'compliance' as const, label: copy.allergenLabel, sub: copy.allergenSub },
      { iconKey: 'paynow' as const, label: copy.paynowLabel, sub: copy.paynowSub },
    ];
  }, [locale, data]);

  return (
    <View testID={testID}>
      <SHCTrustStrip counters={data} items={items} />
    </View>
  );
}
