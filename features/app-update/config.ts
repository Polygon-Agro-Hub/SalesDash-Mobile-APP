import environment from '@/environment/environment';

/**
 * App Update Configuration
 *
 * Automatically syncs with your active environment in environment/environment.ts:
 *   - LOCAL : http://<host-ip>:3000/agro-api/salesdash/api/app-version
 *   - DEV   : https://dev.polygonagro.com/dash-api/agro-api/salesdash/api/app-version
 *   - UAT   : https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash/api/app-version
 *   - PROD  : https://polygonagro.com/dash-api/agro-api/salesdash/api/app-version
 */
export const APP_UPDATE_CONFIG = {
  /**
   * Dynamically resolved from your active environment (LOCAL, DEV, UAT, PROD).
   */
  get policyUrl(): string {
    const baseUrl = environment.API_BASE_URL.endsWith('/')
      ? environment.API_BASE_URL
      : `${environment.API_BASE_URL}/`;
    return `${baseUrl}api/app-version`;
  },

  /**
   * Android package name from app.json → expo.android.package
   */
  androidPackageName: 'com.polygonagro.SalesDash',

  /**
   * iOS Bundle Identifier from app.json → expo.ios.bundleIdentifier
   */
  iosBundleIdentifier: 'com.polygonagro.SalesDash',

  /**
   * iOS App Store numeric ID (from App Store Connect -> App Information -> Apple ID).
   */
  iosAppStoreId: '6763787722',

  /**
   * Maximum milliseconds to wait for the version policy fetch.
   * If the server doesn't respond in time, the check silently fails.
   */
  timeoutMs: 5000,

  /**
   * How long a "Update Later" snooze lasts, in milliseconds.
   * Default: 24 hours.
   */
  snoozeDurationMs: 24 * 60 * 60 * 1000,
};
