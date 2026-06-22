import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RequestDishExperience,
  RequestDishSuccess,
  gourmeatColors,
  shcSpacing,
  type RequestDishPayload,
} from '@shc/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCreateRequest } from '../../hooks/useOrder';

export default function RequestDishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const createReq = useCreateRequest();
  const [done, setDone] = useState(false);
  const [postedId, setPostedId] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(shared)/auth' as any);
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (data: RequestDishPayload) => {
    try {
      const req = await createReq.mutateAsync({
        body: data.body,
        youtube_url: data.youtube_url,
        party_size: data.party_size,
        budget_cents: data.budget_cents,
        date: data.date,
      });
      setPostedId(req?.id);
      setDone(true);
    } catch (e: unknown) {
      Alert.alert('Could not post request', (e as Error)?.message || 'Please try again after signing in.');
    }
  };

  if (authLoading || !user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background }}>
        <ActivityIndicator size="large" color={gourmeatColors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} testID="request-dish-screen">
        <RequestDishSuccess
          requestId={postedId}
          onDiscover={() => router.replace('/(customer)/' as any)}
          onViewProfile={() => router.replace('/(customer)/profile' as any)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} testID="request-dish-screen">
      <RequestDishExperience
        busy={createReq.isPending}
        bottomInset={insets.bottom + shcSpacing.lg}
        onBack={() => router.back()}
        onSubmit={handleSubmit}
      />
    </View>
  );
}