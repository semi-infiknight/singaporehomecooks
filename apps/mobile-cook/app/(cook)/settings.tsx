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
  SHCButton,
  SHCButtonText,
  SHCCard,
  contentPadForTabBar,
  gourmeatColors,
  shcColors,
  shcRadii,
  shcSpacing,
} from '@shc/ui';
import { getCookProfile, updateCookProfile } from '../../lib/api-client';

type CookProfile = {
  display_name?: string;
  area?: string;
  story?: string;
  collection_address?: string;
  collection_instructions?: string;
  availability_paused?: boolean;
};

export default function CookSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [area, setArea] = useState('');
  const [story, setStory] = useState('');
  const [collectionAddress, setCollectionAddress] = useState('');
  const [collectionInstructions, setCollectionInstructions] = useState('');
  const [paused, setPaused] = useState(false);

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
    setDisplayName(String(cook.display_name || ''));
    setArea(String(cook.area || ''));
    setStory(String(cook.story || ''));
    setCollectionAddress(String(cook.collection_address || ''));
    setCollectionInstructions(String(cook.collection_instructions || ''));
    setPaused(Boolean(cook.availability_paused));
  }, [profileQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateCookProfile({
        display_name: displayName.trim() || undefined,
        area: area.trim() || undefined,
        story: story.trim() || undefined,
        collection_address: collectionAddress.trim() || undefined,
        collection_instructions: collectionInstructions.trim() || undefined,
        availability_paused: paused,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cook-profile'] });
      Alert.alert('Saved', 'Kitchen profile updated.');
    },
    onError: (e) => Alert.alert('Could not save', (e as Error).message),
  });

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
        subtitle="Profile, collection details, pause orders"
        testID="cook-settings-hero"
      />

      <SHCCard style={styles.card}>
        <Text style={styles.sectionTitle}>Pause orders</Text>
        <Text style={styles.hint}>
          Temporarily hide your kitchen from new orders. Existing orders stay active.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{paused ? 'Orders paused' : 'Accepting orders'}</Text>
          <Switch
            value={paused}
            onValueChange={setPaused}
            testID="cook-settings-pause-toggle"
          />
        </View>
      </SHCCard>

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
        <TextInput
          value={area}
          onChangeText={setArea}
          placeholder="e.g. Tampines"
          placeholderTextColor={shcColors.textLight}
          style={styles.input}
          testID="cook-settings-area"
        />
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
});
