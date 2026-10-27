const { withAndroidManifest } = require("expo/config-plugins");

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

  // Connectivity — prevents excluding Wi-Fi only tablets
  "android.hardware.telephony",
  "android.hardware.wifi",

  // Audio output & input
  "android.hardware.microphone",
  "android.hardware.audio.output",

  // Screen & Input
  "android.hardware.touchscreen",
  "android.hardware.faketouch",
  "android.hardware.bluetooth",
];

const withOptionalHardwareFeatures = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest) {
      manifest.manifest = {};
    }

    if (!Array.isArray(manifest.manifest["uses-feature"])) {
      manifest.manifest["uses-feature"] = [];
    }

    const existingFeatures = manifest.manifest["uses-feature"];

    OPTIONAL_FEATURES.forEach((featureName) => {
      const existing = existingFeatures.find(
        (f) => f.$?.["android:name"] === featureName
      );

      if (existing) {
        if (!existing.$) existing.$ = {};
        existing.$["android:required"] = "false";
      } else {
        existingFeatures.push({
          $: {
            "android:name": featureName,
            "android:required": "false",
          },
        });
      }
    });

    return config;
  });
};

module.exports = withOptionalHardwareFeatures;