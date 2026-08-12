import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  SHCButton,
  SHCButtonText,
  SHCFoodImage,
  SHCMetaBadge,
  PhotoTipsModalContent,
  useSHCTray,
  SHCTrayAction,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, getDishImageUrl } from '@shc/utils';
import { generateListingImage, getAiImageStatus, getPhotoTips } from '../lib/api-client';

async function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

export function CookListingPhotoPanel({
  dishName,
  cuisine,
  imageUrl,
  onImageUrl,
  testID = 'listing-photo-panel',
}: {
  dishName: string;
  cuisine: string;
  imageUrl: string | null;
  onImageUrl: (url: string) => void;
  testID?: string;
}) {
  const { openTray, dismiss } = useSHCTray();
  const [aiPhotoBusy, setAiPhotoBusy] = useState(false);
  const [aiPhotoNote, setAiPhotoNote] = useState<string | null>(null);
  const [aiImageStatus, setAiImageStatus] = useState<{
    configured?: boolean;
    generate_available?: boolean;
    generate_unavailable_reason?: string | null;
    cuisine_presets?: string[];
    model?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st: Record<string, unknown>) => {
        if (!cancelled) setAiImageStatus(st || {});
      })
      .catch(() => {
        if (!cancelled) {
          setAiImageStatus({
            generate_available: false,
            generate_unavailable_reason: 'Could not reach AI status',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const generateAvailable = aiImageStatus?.generate_available === true || aiImageStatus?.configured === true;
  const generateBlockedReason =
    aiImageStatus?.generate_unavailable_reason ||
    (!generateAvailable && aiImageStatus ? 'AI generate offline — upload a kitchen photo' : null);
  const previewImage = imageUrl || getDishImageUrl({ name: dishName, cuisine });

  const showErrorTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'listing-error', title, height: 'compact' },
        <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} testID="listing-error-tray" />
      );
    },
    [dismiss, openTray]
  );

  const pickImageBase64 = async (): Promise<string | null> => {
    const ImagePicker = await loadImagePicker();
    if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
      showErrorTray(
        'Photo library needs app rebuild',
        'Generate AI still works. For Upload/Brighten, rebuild the cook app (native ImagePicker module missing).'
      );
      return null;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showErrorTray('Permission needed', 'Allow photo library access to upload a dish photo.');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ('images' as any),
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return null;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (/ExponentImagePicker|native module/i.test(msg)) {
        showErrorTray(
          'Photo library needs app rebuild',
          'Generate AI still works without Upload. Rebuild cook iOS/Android to enable camera roll.'
        );
        return null;
      }
      showErrorTray('Photo pick failed', msg || 'Could not open photo library.');
      return null;
    }
  };

  const runGenerateAi = async () => {
    if (!generateAvailable) {
      showErrorTray('AI generate offline', generateBlockedReason || 'Upload a real kitchen photo instead.');
      return;
    }
    if (!dishName.trim()) {
      showErrorTray('Dish name needed', 'Enter a dish name before generating an AI plate.');
      return;
    }
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'generate',
        dish_name: dishName,
        cuisine,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('No image URL returned');
      onImageUrl(url);
      setAiPhotoNote('Illustrative AI plate — real dish may vary. Prefer a kitchen photo when you can.');
    } catch (e) {
      showErrorTray('AI generate failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const polishFromPicker = async (label: 'upload' | 'brighten') => {
    const b64 = await pickImageBase64();
    if (!b64) return;
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'enhance',
        dish_name: dishName || 'Dish',
        cuisine,
        image_base64: b64,
        enhance_style: 'polish',
        ai_restyle: false,
      });
      const url = res.webp_url || res.image_url;
      if (!url) throw new Error('Photo processing failed');
      onImageUrl(url);
      setAiPhotoNote(
        label === 'brighten'
          ? 'Brightened your photo (still your kitchen shot)'
          : 'Kitchen photo uploaded & optimized'
      );
    } catch (e) {
      showErrorTray(label === 'brighten' ? 'Brighten failed' : 'Upload failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
    }
  };

  return (
    <>
      <View style={styles.photoPanel} testID={testID}>
        <Text style={styles.photoPanelTitle}>Dish photo</Text>
        <Text style={styles.photoPanelHint}>Kitchen photo recommended. AI plate is illustrative only.</Text>
        {imageUrl ? (
          <SHCFoodImage uri={imageUrl} height={140} rounded={shcRadii.md} />
        ) : (
          <SHCFoodImage uri={previewImage} height={140} rounded={shcRadii.md} testID="listing-photo-preview" />
        )}
        <View style={styles.photoActions}>
          <SHCButton variant="outline" disabled={aiPhotoBusy} testID="listing-photo-upload" onPress={() => void polishFromPicker('upload')}>
            <SHCButtonText>Upload photo</SHCButtonText>
          </SHCButton>
          <SHCButton variant="outline" disabled={aiPhotoBusy} testID="listing-photo-brighten" onPress={() => void polishFromPicker('brighten')}>
            <SHCButtonText>Brighten</SHCButtonText>
          </SHCButton>
          <SHCButton
            variant="outline"
            disabled={aiPhotoBusy || !dishName.trim() || !generateAvailable}
            testID="listing-photo-generate"
            onPress={() => void runGenerateAi()}
          >
            <SHCButtonText>{aiPhotoBusy ? '…' : generateAvailable ? 'Generate AI' : 'AI offline'}</SHCButtonText>
          </SHCButton>
        </View>
        <Text style={styles.photoNote} testID="listing-photo-help">
          Upload = your shot · Brighten = lighting only · Generate = illustrative AI plate
        </Text>
        {!generateAvailable && generateBlockedReason ? (
          <Text style={styles.photoOffline} testID="listing-photo-ai-offline">
            {generateBlockedReason}
          </Text>
        ) : null}
        {aiPhotoNote ? (
          <Text style={styles.photoNote} testID="listing-photo-note">
            {aiPhotoNote}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={async () => {
          const tips = await getPhotoTips();
          const tipList = (tips as { tips?: string[] }).tips || [];
          openTray(
            { id: 'photo-tips', title: 'Photo tips', height: 'tall' },
            <ScrollView>
              <PhotoTipsModalContent onClose={dismiss} />
              {tipList.map((t: string, i: number) => (
                <Text key={i} style={styles.tipItem}>
                  • {t}
                </Text>
              ))}
            </ScrollView>
          );
        }}
        testID="photo-tips-btn"
        style={styles.photoTipsBtn}
      >
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={48} width={48} rounded={shcRadii.sm} />
        <SHCMetaBadge kind="photo_tips">📸 Photo tips</SHCMetaBadge>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  photoTipsBtn: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  photoPanel: {
    marginTop: 8,
    marginBottom: 8,
    padding: shcSpacing.sm,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surface,
    gap: 8,
  },
  photoPanelTitle: { fontSize: 14, fontWeight: '800', color: shcColors.text },
  photoPanelHint: { fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginBottom: 4 },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoNote: { fontSize: 11, fontWeight: '600', color: shcColors.textLight },
  photoOffline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: shcRadii.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tipItem: { marginTop: 4, fontSize: 13 },
});
