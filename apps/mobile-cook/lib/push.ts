import { NativeModules, Platform } from 'react-native';
import { registerPushToken } from './api-client';

/** True when ExpoPushTokenManager is compiled into the native binary. */
export function isPushNativeModuleAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return !!NativeModules.ExpoPushTokenManager;
}

/** Register Expo push token after cook login. No-ops when native module unavailable. */
export async function registerCookPushToken(cookId: string): Promise<string | null> {
  if (!isPushNativeModuleAvailable()) return null;

  try {
    const Notifications = await import('expo-notifications');
    const Constants = await import('expo-constants');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.default.expoConfig?.extra?.eas?.projectId ?? Constants.default.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    await registerPushToken(cookId, token);
    return token;
  } catch {
    return null;
  }
}