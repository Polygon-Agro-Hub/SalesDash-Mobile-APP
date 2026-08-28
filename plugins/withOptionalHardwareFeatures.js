const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Custom Expo config plugin — withOptionalHardwareFeatures
 *
 * Problem:
 *   When Android sees permissions like CAMERA or RECORD_AUDIO declared in the
 *   merged AndroidManifest, it may implicitly mark the corresponding hardware
 *   features (android.hardware.camera, android.hardware.microphone) as required.
 *   This causes the Play Store to filter out devices that report those features
 *   differently — such as rugged enterprise scanners (e.g. Chainway C66).
 *
 * Fix:
 *   Explicitly add <uses-feature android:required="false"> entries so the Play
 *   Store knows these hardware features are optional, keeping the app available
 *   on all compatible devices regardless of how they report their hardware.
 */

const OPTIONAL_FEATURES = [
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.camera.front",
  "android.hardware.microphone",
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
