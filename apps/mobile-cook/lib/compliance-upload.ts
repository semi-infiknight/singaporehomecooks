import { Alert } from 'react-native';
import { submitComplianceDoc, uploadImageToServer } from './api-client';

export type PickedComplianceFile = {
  name: string;
  base64: string;
  mimeType: string;
};

async function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

/** Pick a certificate photo from the device library. */
export async function pickComplianceCertificate(): Promise<PickedComplianceFile | null> {
  const ImagePicker = await loadImagePicker();
  if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
    Alert.alert(
      'Photo library unavailable',
      'Rebuild the cook app to enable certificate photo uploads, or enter a reference below.'
    );
    return null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload your certificate.');
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
  const name = asset.fileName || `cert-${Date.now()}.jpg`;
  return {
    name,
    base64: `data:${mimeType};base64,${asset.base64}`,
    mimeType,
  };
}

/** Upload cert to MinIO then register compliance doc with ops. */
export async function uploadComplianceCertificate(
  cookId: string,
  type: 'sfa' | 'wsq' | 'halal',
  file: PickedComplianceFile
) {
  const ext = file.mimeType.includes('png') ? 'png' : file.mimeType.includes('webp') ? 'webp' : 'jpg';
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.[^.]+$/, '') || 'cert';
  const objectName = `compliance/${cookId}/${type}/${Date.now()}-${safeBase}.${ext}`;
  const uploaded = await uploadImageToServer(file.base64, objectName, cookId, file.mimeType);
  const fileKey = String((uploaded as { key?: string }).key || objectName);
  return submitComplianceDoc({ type, file_key: fileKey });
}
