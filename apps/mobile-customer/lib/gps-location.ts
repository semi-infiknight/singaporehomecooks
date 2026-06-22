import { Platform } from 'react-native';

export type GpsCoords = { lat: number; lng: number };

export type GpsErrorReason = 'unavailable' | 'denied' | 'failed';

function isNativeModuleMissingError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? String(e);
  return /ExpoLocation|native module|Native module/i.test(msg);
}

/** Request permission and read GPS. Returns null with a reason when unavailable. */
export async function getCurrentGpsCoords(): Promise<
  { ok: true; coords: GpsCoords } | { ok: false; reason: GpsErrorReason }
> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 8000,
      mayShowUserSettingsDialog: true,
    });
    return {
      ok: true,
      coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
    };
  } catch (e: unknown) {
    if (isNativeModuleMissingError(e)) {
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: false, reason: 'failed' };
  }
}