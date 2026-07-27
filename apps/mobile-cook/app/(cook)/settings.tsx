import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCFoodImage,
  SHCSkeletonList,
  gourmeatColors,
  gourmeatRadii,
  shcSpacing,
  contentPadSafe,
} from '@shc/ui';
import { getCookAvatarUrl, getCookKitchenHeroUrl } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { getMe, updateCookProfile } from '../../lib/api-client';
import { pickCookMediaImage, uploadCookMediaImage } from '../../lib/cook-media-upload';

type CookProfile = {
  display_name?: string;
  avatar_url?: string;
  hero_image_url?: string;
};

export default function CookSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CookProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'avatar' | 'hero' | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMe();
        const res = await (await import('../../lib/api-client')).client.getCookProfile();
        if (!cancelled) setProfile((res.cook || {}) as CookProfile);
      } catch {
        /* optional */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (kind: 'avatar' | 'hero') => {
    const cookId = user?.id;
    if (!cookId || busy) return;
    const picked = await pickCookMediaImage();
    if (!picked) return;
    setBusy(kind);
    try {
      const uploaded = await uploadCookMediaImage(cookId, kind, picked);
      const patch = kind === 'avatar' ? { avatar_url: uploaded.key } : { hero_image_url: uploaded.key };
      const res = await updateCookProfile(patch);
      setProfile((res.cook || {}) as CookProfile);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Could not upload photo');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={3} rowHeight={72} />
      </View>
    );
  }

  const name = profile?.display_name || user?.name || 'Chef';
  const avatar = getCookAvatarUrl(user?.id, name, profile?.avatar_url);
  const hero = getCookKitchenHeroUrl(user?.id, profile?.hero_image_url);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + shcSpacing.md,
          paddingBottom: contentPadSafe(insets.bottom),
          paddingHorizontal: shcSpacing.md,
        },
      ]}
      testID="cook-settings-screen"
    >
      <GourmeatPrimaryButton
        label="← Dashboard"
        variant="outline"
        onPress={() => router.back()}
        style={{ alignSelf: 'flex-start', marginBottom: shcSpacing.md }}
      />
      <Text style={styles.title}>Profile photos</Text>
      <Text style={styles.subtitle}>Your avatar and kitchen hero appear on customer browse and kitchen pages.</Text>

      <GourmeatCard style={{ marginBottom: shcSpacing.md }}>
        <Text style={styles.label}>Profile avatar</Text>
        <View style={styles.row}>
          <SHCFoodImage uri={avatar} height={80} width={80} rounded={40} />
          <GourmeatPrimaryButton
            label={busy === 'avatar' ? 'Uploading…' : 'Upload avatar'}
            variant="outline"
            onPress={() => void handleUpload('avatar')}
            loading={busy === 'avatar'}
            disabled={!!busy}
            testID="cook-settings-avatar-btn"
          />
        </View>
      </GourmeatCard>

      <GourmeatCard>
        <Text style={styles.label}>Kitchen hero</Text>
        <SHCFoodImage uri={hero} height={160} rounded={gourmeatRadii.lg} />
        <GourmeatPrimaryButton
          label={busy === 'hero' ? 'Uploading…' : 'Upload kitchen photo'}
          variant="outline"
          onPress={() => void handleUpload('hero')}
          loading={busy === 'hero'}
          disabled={!!busy}
          testID="cook-settings-hero-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
      </GourmeatCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  title: { fontSize: 24, fontWeight: '900', color: gourmeatColors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.md },
  label: { fontSize: 12, fontWeight: '800', color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.md },
});
