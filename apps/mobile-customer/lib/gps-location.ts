import { Platform } from 'react-native';

export type GpsCoords = { lat: number; lng: number };

export type GpsErrorReason = 'unavailable' | 'denied' | 'failed' | 'no_fix_location';

/** Tampines, Singapore — used when the iOS/Android emulator has no GPS fix. */
export const SG_EMULATOR_FALLBACK_COORDS: GpsCoords = { lat: 1.3496, lng: 103.9568 };

function isNativeModuleMissingError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? String(e);
  return /ExpoLocation|native module|Native module/i.test(msg);
}

/**
 * Request permission and read GPS.
 * On simulators, Features → Location is often "None" which makes getCurrentPosition hang/fail —
 * we time out and (in __DEV__) fall back to a Singapore coordinate so area pick still works.
 */
export async function getCurrentGpsCoords(opts?: {
  /** When true (default in __DEV__), return Tampines if the sim has no fix. */
  allowEmulatorFallback?: boolean;
}): Promise<{ ok: true; coords: GpsCoords; via?: 'gps' | 'emulator_fallback' } | { ok: false; reason: GpsErrorReason }> {
  const allowEmulatorFallback = opts?.allowEmulatorFallback ?? __DEV__;

  if (Platform.OS === 'web') {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    const servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!servicesOn) {
      if (allowEmulatorFallback) {
        return { ok: true, coords: SG_EMULATOR_FALLBACK_COORDS, via: 'emulator_fallback' };
      }
      return { ok: false, reason: 'no_fix_location' };
    }

    // Simulator with Location=None never resolves — bound the wait.
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);

    if (!pos) {
      if (allowEmulatorFallback) {
        return { ok: true, coords: SG_EMULATOR_FALLBACK_COORDS, via: 'emulator_fallback' };
      }
      return { ok: false, reason: 'no_fix_location' };
    }

    return {
      ok: true,
      coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      via: 'gps',
    };
  } catch (e: unknown) {
    if (isNativeModuleMissingError(e)) {
      // Dev client missing native module — rebuild required; still unblock UI in __DEV__.
      if (allowEmulatorFallback) {
        return { ok: true, coords: SG_EMULATOR_FALLBACK_COORDS, via: 'emulator_fallback' };
      }
      return { ok: false, reason: 'unavailable' };
    }
    if (allowEmulatorFallback) {
      return { ok: true, coords: SG_EMULATOR_FALLBACK_COORDS, via: 'emulator_fallback' };
    }
    return { ok: false, reason: 'failed' };
  }
}

/** Short copy for Alerts when GPS fails on a simulator. */
export function gpsFailureHelp(reason: GpsErrorReason): { title: string; message: string } {
  switch (reason) {
    case 'denied':
      return {
        title: 'Location permission needed',
        message:
          'On simulator: Settings → Privacy → Location Services → SHC Customer → While Using.\nOn device: allow location when prompted.',
      };
    case 'unavailable':
      return {
        title: 'Location module missing',
        message:
          'This JS bundle cannot talk to GPS. Rebuild the native app:\n\n  cd apps/mobile-customer && npx expo run:ios\n\nOr use neighbourhood search.',
      };
    case 'no_fix_location':
      return {
        title: 'Simulator has no GPS fix',
        message:
          'In Simulator menu: Features → Location → Custom Location…\nSet Latitude 1.3496, Longitude 103.9568 (Singapore).\n\nOr Features → Location → Apple (then move pin).\n\nYou can also search for Tampines / Bishan.',
      };
    default:
      return {
        title: 'Could not get location',
        message:
          'Set a custom location in the Simulator (Features → Location), grant permission, or search for your neighbourhood.',
      };
  }
}