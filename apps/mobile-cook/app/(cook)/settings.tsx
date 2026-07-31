import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCButton,
  SHCButtonText,
  SHCCard,
  SHCFoodImage,
  contentPadForTabBar,
  gourmeatColors,
  gourmeatRadii,
  shcColors,
  shcRadii,
  shcSpacing,
  SHCCookCollectionSlotEditor,
  SHCCookAreaPicker,
} from '@shc/ui';
import { getCookAvatarUrl, getCookKitchenHeroUrl, normalizeCookAreaInput, normalizeCookCollectionTimeSlots } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { getCookProfile, updateCookProfile } from '../../lib/api-client';
import { pickCookMediaImage, uploadCookMediaImage } from '../../lib/cook-media-upload';

type CookProfile = {
  display_name?: string;
  area?: string;
  story?: string;
  collection_address?: string;
  collection_instructions?: string;
  collection_time_slots?: string[];
  availability_paused?: boolean;
  avatar_url?: string;
  hero_image_url?: string;
  paynow_mobile?: string;
  paynow_uen?: string;
  payout_legal_name?: string;
};

export default function CookSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
  const [story, setStory] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [collectionTimeSlots, setCollectionTimeSlots] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [paynowMobile, setPaynowMobile] = useState('');
  const [paynowUen, setPaynowUen] = useState('');
  const [payoutLegalName, setPayoutLegalName] = useState('');
  const [profile, setProfile] = useState<CookProfile | null>(null);
  const [busy, setBusy] = useState<'avatar' | 'hero' | null>(null);

  const profileQ = useQuery({
    queryKey: ['cook-profile'],
    queryFn: async () => {
      const res = await getCookProfile();
      return res.cook as CookProfile;
    },
  });

  useEffect(() => {
    const cook = profileQ.data;
    if (!cook) return;
    setProfile(cook);
    setDisplayName(String(cook.display_name || ''));
    setArea(String(cook.area || ''));
    setStory(String(cook.story || ''));
    setCollectionAddress(String(cook.collection_address || ''));
    setCollectionInstructions(String(cook.collection_instructions || ''));
    setCollectionTimeSlots(normalizeCookCollectionTimeSlots(cook.collection_time_slots));
    setPaused(Boolean(cook.availability_paused));
    setPaynowMobile(String(cook.paynow_mobile || ''));
    setPaynowUen(String(cook.paynow_uen || ''));
    setPayoutLegalName(String(cook.payout_legal_name || ''));
  }, [profileQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateCookProfile({
        display_name: displayName.trim() || undefined,
        area: normalizeCookAreaInput(area) || undefined,
        story: story.trim() || undefined,
        collection_address: collectionAddress.trim() || undefined,
        collection_instructions: collectionInstructions.trim() || undefined,
        collection_time_slots: collectionTimeSlots,
        availability_paused: paused,
        paynow_mobile: paynowMobile.trim() || undefined,
        paynow_uen: paynowUen.trim() || undefined,
        payout_legal_name: payoutLegalName.trim() || undefined,
      }),
    onSuccess: (res) => {
      setProfile((res.cook || {}) as CookProfile);
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
      Alert.alert('Saved', 'Kitchen profile updated.');
    },
    onError: (e) => Alert.alert('Could not save', (e as Error).message),
  });

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
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Could not upload photo');
    } finally {
      setBusy(null);
    }
  };

  const name = profile?.display_name || user?.name || 'Chef';
  const avatar = getCookAvatarUrl(user?.id, name, profile?.avatar_url);
  const hero = getCookKitchenHeroUrl(user?.id, profile?.hero_image_url);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingBottom: contentPadForTabBar(insets.bottom),
        paddingHorizontal: shcSpacing.md,
      }}
      testID="cook-settings-screen"
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Dashboard</Text>
      </Pressable>

      <GourmeatCookHeader
        title="Kitchen settings"
        subtitle="Photos, profile, collection details, pause orders"
        testID="cook-settings-hero"
      />

      <GourmeatCard style={styles.card}>
        <Text style={styles.sectionTitle}>Profile avatar</Text>
        <View style={styles.mediaRow}>
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

      <GourmeatCard style={styles.card}>
        <Text style={styles.sectionTitle}>Kitchen hero</Text>
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

      <SHCCard style={styles.card}>
        <Text style={styles.sectionTitle}>Pause orders</Text>
        <Text style={styles.hint}>
          Temporarily hide your kitchen from new orders. Existing orders stay active.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{paused ? 'Orders paused' : 'Accepting orders'}</Text>
          <Switch value={paused} onValueChange={setPaused} testID="cook-settings-pause-toggle" />
        </View>
      </SHCCard>

      <GourmeatCard style={styles.card}>
        <SHCCookCollectionSlotEditor value={collectionTimeSlots} onChange={setCollectionTimeSlots} />
      </GourmeatCard>

      <SHCCard style={styles.card}>
        <Text style={styles.sectionTitle}>Kitchen profile</Text>
        <Text style={styles.fieldLabel}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Auntie Rose"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="cook-settings-display-name"
        />
        <Text style={styles.fieldLabel}>Area</Text>
        <Text style={styles.hint}>Customers see this on your kitchen card and sort by distance.</Text>
        <SHCCookAreaPicker value={area} onChange={setArea} testID="cook-settings-area" />
        <Text style={styles.fieldLabel}>Heritage story</Text>
        <TextInput
          value={story}
          onChangeText={setStory}
          placeholder="What makes your kitchen special?"
          placeholderTextColor={shcColors.textLight}
          multiline
          style={[styles.input, styles.textArea]}
          testID="cook-settings-story"
        />
      </SHCCard>

      <SHCCard style={styles.card}>
        <Text style={styles.sectionTitle}>Collection</Text>
        <Text style={styles.hint}>Shared with customers after you accept an order.</Text>
        <Text style={styles.fieldLabel}>HDB address</Text>
        <TextInput
          value={collectionAddress}
          onChangeText={setCollectionAddress}
          placeholder="Blk, street, unit"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="cook-settings-address"
        />
        <Text style={styles.fieldLabel}>Pickup instructions</Text>
        <TextInput
          value={collectionInstructions}
          onChangeText={setCollectionInstructions}
          placeholder="Lift lobby, WhatsApp on arrival…"
          placeholderTextColor={shcColors.textLight}
          multiline
          style={[styles.input, styles.textArea]}
          testID="cook-settings-instructions"
        />
      </SHCCard>

      <SHCCard style={styles.card}>
        <Text style={styles.sectionTitle}>PayNow payouts</Text>
        <Text style={styles.hint}>
          Optional. Add your PayNow mobile or UEN + legal name to receive weekly payouts. We assume you own this PayNow.
        </Text>
        <Text style={styles.fieldLabel}>PayNow mobile</Text>
        <TextInput
          value={paynowMobile}
          onChangeText={setPaynowMobile}
          placeholder="9123 4567"
          placeholderTextColor={shcColors.textLight}
          keyboardType="phone-pad"
          style={styles.input}
          testID="cook-settings-paynow-mobile"
        />
        <Text style={styles.fieldLabel}>UEN (business)</Text>
        <TextInput
          value={paynowUen}
          onChangeText={setPaynowUen}
          placeholder="201234567A"
          placeholderTextColor={shcColors.textLight}
          autoCapitalize="characters"
          style={styles.input}
          testID="cook-settings-paynow-uen"
        />
        <Text style={styles.fieldLabel}>Legal name (for UEN)</Text>
        <TextInput
          value={payoutLegalName}
          onChangeText={setPayoutLegalName}
          placeholder="As per bank / ACRA"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="cook-settings-payout-legal-name"
        />
      </SHCCard>

      <SHCButton
        onPress={() => saveMut.mutate()}
        disabled={saveMut.isPending || profileQ.isLoading}
        testID="cook-settings-save-btn"
      >
        <SHCButtonText>{saveMut.isPending ? 'Saving…' : 'Save settings'}</SHCButtonText>
      </SHCButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  back: { fontSize: 16, fontWeight: '700', color: shcColors.primary, marginBottom: shcSpacing.sm },
  card: { marginBottom: shcSpacing.md, gap: shcSpacing.xs },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: shcColors.text },
  hint: { fontSize: 13, fontWeight: '600', color: shcColors.textLight, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: shcColors.text, marginTop: shcSpacing.sm },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.md,
    backgroundColor: '#FAFAFA',
    color: shcColors.text,
    fontSize: 16,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: shcSpacing.sm,
  },
  switchLabel: { fontSize: 15, fontWeight: '700', color: shcColors.text, flex: 1, paddingRight: shcSpacing.md },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.md },
});
