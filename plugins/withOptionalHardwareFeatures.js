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
  "android.hardware.audio.output",
];

const withOptionalHardwareFeatures = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!Array.isArray(manifest.manifest["uses-feature"])) {
      manifest.manifest["uses-feature"] = [];
    }

    const existingFeatures = manifest.manifest["uses-feature"];

    OPTIONAL_FEATURES.forEach((featureName) => {
      const alreadyDeclared = existingFeatures.some(
        (f) => f.$?.["android:name"] === featureName
      );

      if (!alreadyDeclared) {
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