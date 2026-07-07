import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text, Pressable } from 'react-native';
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
import { useShcI18n } from '@shc/i18n';

export default function RequestDishScreen() {
  const { t } = useShcI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const createReq = useCreateRequest();
  const [done, setDone] = useState(false);
  const [postedId, setPostedId] = useState<string | undefined>();
  const [requestDishEnabled, setRequestDishEnabled] = useState(true);
  const [flagLoading, setFlagLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(shared)/auth' as any);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { isFeatureEnabled } = await import('../../lib/api-client');
        const enabled = await isFeatureEnabled('request_dish');
        if (!cancelled) setRequestDishEnabled(enabled);
      } catch {
        if (!cancelled) setRequestDishEnabled(true);
      } finally {
        if (!cancelled) setFlagLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      Alert.alert(t('request.error_title'), (e as Error)?.message || t('request.error_body'));
    }
  };

  if (authLoading || !user || flagLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background }}>
        <ActivityIndicator size="large" color={gourmeatColors.primary} />
      </View>
    );
  }

  if (!requestDishEnabled) {
    return (
      <View
        style={{ flex: 1, paddingTop: insets.top + shcSpacing.lg, paddingHorizontal: shcSpacing.lg, backgroundColor: gourmeatColors.background }}
        testID="request-dish-paused"
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: gourmeatColors.text }}>{t('request.paused_title')}</Text>
        <Text style={{ marginTop: 12, fontSize: 15, color: gourmeatColors.textMuted, lineHeight: 22 }}>
          {t('request.paused_body')}
        </Text>
        <Pressable onPress={() => router.replace('/(customer)/' as any)} style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: gourmeatColors.primary }}>{t('orders.browse_cta')}</Text>
        </Pressable>
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