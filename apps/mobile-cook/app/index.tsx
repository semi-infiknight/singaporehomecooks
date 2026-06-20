import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { shcColors } from '@shc/ui';
import { hasSeenCookOnboarding } from '../lib/onboarding';

export default function RootIndex() {
  const { user, loading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const seen = await hasSeenCookOnboarding();
      if (cancelled) return;
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (loading || (user && !onboardingChecked)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background }}>
        <ActivityIndicator color={shcColors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(shared)/auth" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(shared)/onboarding" />;
  }

  return <Redirect href="/(cook)/dashboard" />;
}