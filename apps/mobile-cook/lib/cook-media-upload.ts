import { Alert } from 'react-native';
import { cookMediaObjectName, type CookMediaKind } from '@shc/utils';
import { uploadImageToServer } from './api-client';

export type PickedCookMediaFile = {
  name: string;
  base64: string;
  mimeType: string;
  /** Local file URI for immediate preview before upload completes. */
  uri?: string;
};

async function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

export async function pickCookMediaImage(): Promise<PickedCookMediaFile | null> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
    Alert.alert(
      'Photo library unavailable',
      'Rebuild the cook app to enable profile photo uploads.'
    );
    return null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload your profile photo.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ('images' as any),
    quality: 0.85,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/jpeg';
  const name = asset.fileName || `photo-${Date.now()}.jpg`;
  return {
    name,
    base64: `data:${mimeType};base64,${asset.base64}`,
    mimeType,
    uri: asset.uri,
  };
}

export async function uploadCookMediaImage(
  cookId: string,
  kind: CookMediaKind,
  file: PickedCookMediaFile
) {
  const objectName = cookMediaObjectName(cookId, kind, file.name, file.mimeType);
  const uploaded = await uploadImageToServer(file.base64, objectName, cookId, file.mimeType);
  const key = String((uploaded as { key?: string }).key || objectName);
  const url =
    (uploaded as { image_url?: string }).image_url ||
    (uploaded as { url?: string }).url ||
    undefined;
  return { key, url };
}
