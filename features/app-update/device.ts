import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { APP_UPDATE_CONFIG } from './config';
import type { StorePlatform } from './updatePolicy';

export function getPlatform(): StorePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * Returns the version string of the installed app.
 * In development (__DEV__) or Expo Go: Always uses app.json version ("1.0.0") so update testing works reliably.
 * In standalone production builds: Uses Application.nativeApplicationVersion.
 */
export function getInstalledVersion(): string {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (__DEV__ || isExpoGo) {
    return Constants.expoConfig?.version ?? '1.0.0';
  }

  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    '1.0.0'
  );
}

export function getOsVersion(): string | number {
  return Platform.Version;
}

export async function openStore(): Promise<void> {
  const isIos = Platform.OS === 'ios';

  if (isIos) {
    const appleId = APP_UPDATE_CONFIG.iosAppStoreId?.trim();
    const bundleId = APP_UPDATE_CONFIG.iosBundleIdentifier?.trim() || 'com.polygonagro.SalesDash';

    const storeUrl = appleId
      ? `itms-apps://apps.apple.com/app/id${appleId}`
      : `itms-apps://apps.apple.com/app/${bundleId}`;

    const webUrl = appleId
      ? `https://apps.apple.com/app/id${appleId}`
      : `https://apps.apple.com/app/${bundleId}`;

    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      await Linking.openURL(canOpen ? storeUrl : webUrl);
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch {
        // Silently swallow
      }
    }
    return;
  }

  const storeUrl = `market://details?id=${APP_UPDATE_CONFIG.androidPackageName}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${APP_UPDATE_CONFIG.androidPackageName}`;

  try {
    const canOpen = await Linking.canOpenURL(storeUrl);
    await Linking.openURL(canOpen ? storeUrl : webUrl);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      // Silently swallow
    }
  }
}
