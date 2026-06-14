// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Button, ButtonText, Card as GCard } from '@gluestack-ui/themed';
import { shcColors, shcRadii, shcSpacing } from './theme';

// Simple RN Pressable based to avoid gluestack prop type drift in monorepo tsc (real gluestack usage in mobile screens ok if direct)
export const SHCButton = ({ children, onPress, disabled, testID, style }: any) => (
  <Pressable onPress={onPress} disabled={disabled} testID={testID} style={[{ backgroundColor: '#1D9E75', padding: 10, borderRadius: 8, opacity: disabled ? 0.6 : 1 }, style]}>
    {typeof children === 'string' ? <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>{children}</Text> : children}
  </Pressable>
);
export const SHCButtonText = ({ children }: any) => <Text style={{ color: '#fff', fontWeight: '600' }}>{children}</Text>;

export function SHCCard({ children, style, ...props }: any) {
  return (
    <GCard
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: shcRadii.lg,
          padding: shcSpacing.md,
          borderWidth: 1,
          borderColor: '#E8D5B7',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </GCard>
  );
}

export function SHCBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'heritage' }) {
  const bg = variant === 'success' ? '#DCFCE7' : variant === 'warning' ? '#FEF3C7' : variant === 'error' ? '#FEE2E2' : variant === 'heritage' ? '#FDF2E9' : '#F5F0E6';
  const color = variant === 'success' ? shcColors.success : variant === 'warning' ? shcColors.warning : variant === 'error' ? shcColors.error : shcColors.text;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: shcSpacing.sm, paddingVertical: 2, borderRadius: shcRadii.sm }}>
      <Text style={{ fontSize: 12, color, fontWeight: '500' }}>{children}</Text>
    </View>
  );
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <View style={{ backgroundColor: '#FEE2E2', borderRadius: shcRadii.md, padding: shcSpacing.md, borderLeftWidth: 4, borderLeftColor: shcColors.error, marginVertical: shcSpacing.sm }}>
      {code && <Text style={{ fontSize: 10, color: shcColors.error, fontWeight: '600' }}>{code}</Text>}
      <Text style={{ color: shcColors.text, marginTop: 2 }}>{message}</Text>
    </View>
  );
}

export function SHCInput(props: any) {
  // Thin wrapper, can expand with gluestack Input later
  return <View style={{ borderWidth: 1, borderColor: '#E8D5B7', borderRadius: shcRadii.md, padding: shcSpacing.sm, backgroundColor: '#fff' }} {...props} />;
}

export function SHCSectionTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[{ fontSize: 18, fontWeight: '600', color: shcColors.primary, marginBottom: shcSpacing.sm, marginTop: shcSpacing.md }, style]}>{children}</Text>;
}
