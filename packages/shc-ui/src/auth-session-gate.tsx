// Gate signed-in screens: skeleton while session hydrates, guest only when confirmed logged out.
// @ts-nocheck
import React from 'react';
import { View } from 'react-native';
import { resolveAuthSessionState } from '@shc/utils';
import { SHCSkeletonAccountScreen, SHCSkeletonList } from './skeleton';

export function SHCAuthSessionGate({
  loading,
  user,
  guest,
  children,
  skeleton,
  testID,
}: {
  loading: boolean;
  user: unknown;
  guest: React.ReactNode;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  testID?: string;
}) {
  const session = resolveAuthSessionState(loading, user);
  if (session === 'loading') {
    return (
      <View testID={testID ?? 'auth-session-loading'} accessibilityLabel="Loading">
        {skeleton ?? <SHCSkeletonAccountScreen />}
      </View>
    );
  }
  if (session === 'guest') {
    return <View testID={testID ?? 'auth-session-guest'}>{guest}</View>;
  }
  return <>{children}</>;
}

/** Compact ghost for nested sections (subscriptions tab body, etc.). */
export function SHCAuthSessionSection({
  loading,
  user,
  guest,
  children,
}: {
  loading: boolean;
  user: unknown;
  guest: React.ReactNode;
  children: React.ReactNode;
}) {
  const session = resolveAuthSessionState(loading, user);
  if (session === 'loading') return <SHCSkeletonList count={3} rowHeight={120} />;
  if (session === 'guest') return guest;
  return children;
}
