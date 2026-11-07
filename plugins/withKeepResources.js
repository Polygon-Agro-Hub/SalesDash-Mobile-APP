const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to prevent AAPT2 resource shrinking from deleting
 * required drawables, fonts, splash screens, and layout assets when
 * enableShrinkResourcesInReleaseBuilds is set to true.
 */
function withKeepResources(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resRawDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "raw"
      );
      if (!fs.existsSync(resRawDir)) {
        fs.mkdirSync(resRawDir, { recursive: true });
      }
      const keepXmlPath = path.join(resRawDir, "keep.xml");
      const keepXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:shrinkMode="safe"
    tools:keep="@layout/*,@drawable/*,@font/*,@raw/*,@xml/*,@string/*,@color/*,@mipmap/*" />
`;
      fs.writeFileSync(keepXmlPath, keepXmlContent, "utf8");
      return config;
    },
  ]);
}

module.exports = withKeepResources;
