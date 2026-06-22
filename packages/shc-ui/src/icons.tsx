// Ionicons for Zomato-style tab bar + UI cues (mobile only).
// @ts-nocheck
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shcColors, shcBorders, shcShadows } from './theme';

export type SHCTabIconKey =
  | 'discover'
  | 'orders'
  | 'cart'
  | 'profile'
  | 'dashboard'
  | 'listings'
  | 'compliance'
  | 'search'
  | 'chat'
  | 'location'
  | 'clock'
  | 'notifications';

export type SHCExtraIconKey =
  | 'credits'
  | 'request'
  | 'earnings'
  | 'paynow'
  | 'document'
  | 'education'
  | 'filters'
  | 'flame'
  | 'leaf'
  | 'people'
  | 'checkmark'
  | 'home'
  | 'restaurant';

export type SHCIconKey = SHCTabIconKey | SHCExtraIconKey;

const TAB_GLYPHS: Record<SHCTabIconKey, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  discover: { active: 'home', inactive: 'home-outline' },
  orders: { active: 'receipt', inactive: 'receipt-outline' },
  cart: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
  dashboard: { active: 'grid', inactive: 'grid-outline' },
  listings: { active: 'restaurant', inactive: 'restaurant-outline' },
  compliance: { active: 'shield-checkmark', inactive: 'shield-checkmark-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  chat: { active: 'chatbubble', inactive: 'chatbubble-outline' },
  location: { active: 'location', inactive: 'location-outline' },
  clock: { active: 'time', inactive: 'time-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
};

const EXTRA_GLYPHS: Record<SHCExtraIconKey, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  credits: { active: 'wallet', inactive: 'wallet-outline' },
  request: { active: 'create', inactive: 'create-outline' },
  earnings: { active: 'cash', inactive: 'cash-outline' },
  paynow: { active: 'card', inactive: 'card-outline' },
  document: { active: 'document-text', inactive: 'document-text-outline' },
  education: { active: 'school', inactive: 'school-outline' },
  filters: { active: 'options', inactive: 'options-outline' },
  flame: { active: 'flame', inactive: 'flame-outline' },
  leaf: { active: 'leaf', inactive: 'leaf-outline' },
  people: { active: 'people', inactive: 'people-outline' },
  checkmark: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  home: { active: 'home', inactive: 'home-outline' },
  restaurant: { active: 'restaurant', inactive: 'restaurant-outline' },
};

const ALL_GLYPHS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  ...TAB_GLYPHS,
  ...EXTRA_GLYPHS,
};

export function SHCIcon({
  name,
  size = 22,
  color = shcColors.text,
  active = false,
  testID,
}: {
  name: SHCIconKey | keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  active?: boolean;
  testID?: string;
}) {
  const glyph =
    name in ALL_GLYPHS
      ? ALL_GLYPHS[name as string][active ? 'active' : 'inactive']
      : (name as keyof typeof Ionicons.glyphMap);
  return <Ionicons name={glyph} size={size} color={color} testID={testID} />;
}

export function SHCTabIcon({
  iconKey,
  active,
  size = 22,
}: {
  iconKey: SHCTabIconKey;
  active: boolean;
  size?: number;
}) {
  return (
    <SHCIcon
      name={iconKey}
      active={active}
      size={size}
      color={active ? shcColors.primary : shcColors.textLight}
    />
  );
}

/** Circular icon badge for bento tiles and stat cells */
export function SHCBentoIconBadge({
  iconKey,
  size = 32,
  active = true,
  testID,
}: {
  iconKey: SHCIconKey;
  size?: number;
  active?: boolean;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: shcColors.surface,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...shcShadows.brutalSm,
      }}
    >
      <SHCIcon name={iconKey} size={Math.round(size * 0.48)} color={shcColors.primary} active={active} />
    </View>
  );
}