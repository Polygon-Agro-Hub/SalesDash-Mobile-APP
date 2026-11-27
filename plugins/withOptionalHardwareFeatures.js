const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Custom Expo config plugin — withOptionalHardwareFeatures
 *
 * Problem:
 *   When Android sees permissions declared in the merged AndroidManifest, it may
 *   implicitly mark corresponding hardware features as required. This causes the
 *   Play Store to filter out devices that do not report those features.
 *
 * Fix:
 *   Explicitly add <uses-feature android:required="false"> entries so the Play
 *   Store knows these hardware features are optional, keeping the app available
 *   on all compatible devices regardless of how they report their hardware.
 *
 * Note:
 *   Camera, microphone, and audio permissions are now blocked in app.json so
 *   only audio output is listed here as a safeguard for notification sounds.
 */

const OPTIONAL_FEATURES = [
  // Screen & Orientation features — fixing Google Play Console warning for tablets, desktops, and XR
  "android.hardware.screen.portrait",
  "android.hardware.screen.landscape",

  // Connectivity — prevents excluding cellular-only or Wi-Fi only devices
  "android.hardware.wifi",
  "android.hardware.telephony",

  // Camera features — adding CAMERA permission implicitly requires these,
  // which filters out tablets and devices without autofocus or back cameras.
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.camera.front",
  "android.hardware.camera.any",
  "android.hardware.camera.flash",

  // Location features — prevents excluding Wi-Fi only devices lacking hardware GPS
  "android.hardware.location",
  "android.hardware.location.gps",
  "android.hardware.location.network",

  // Audio output & input
  "android.hardware.microphone",
  "android.hardware.audio.output",

  // Screen & Input
  "android.hardware.touchscreen",
  "android.hardware.faketouch",
  "android.hardware.bluetooth",

  // Biometric & Fingerprint — ensures devices without biometric hardware can still install app
  "android.hardware.fingerprint",
  "android.hardware.biometrics",
];

const withOptionalHardwareFeatures = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest) {
      manifest.manifest = {};
    }

    const androidManifest = manifest.manifest;

    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    if (!androidManifest.$["xmlns:tools"]) {
      androidManifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    if (!Array.isArray(androidManifest["uses-feature"])) {
      androidManifest["uses-feature"] = [];
    }

    const existingFeatures = androidManifest["uses-feature"];

    OPTIONAL_FEATURES.forEach((featureName) => {
      const existing = existingFeatures.find(
        (f) => f.$?.["android:name"] === featureName
      );

      if (existing) {
        if (!existing.$) existing.$ = {};
        existing.$["android:required"] = "false";
        existing.$["tools:replace"] = "android:required";
      } else {
        existingFeatures.push({
          $: {
            "android:name": featureName,
            "android:required": "false",
            "tools:replace": "android:required",
          },
        });
      }
    });

    return config;
  });
};

module.exports = withOptionalHardwareFeatures;