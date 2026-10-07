const { AndroidConfig, withAndroidManifest, withMainActivity } = require("expo/config-plugins");

const marker = "// Codematica live font scale";

function fontScaleConfigChanges(value) {
  const changes = value ? value.split("|") : [];
  return changes.includes("fontScale") ? value : [...changes, "fontScale"].join("|");
}

function updateFontScaleActivity(contents) {
  if (contents.includes(marker)) return contents;
  if (/override\s+fun\s+onConfigurationChanged\s*\(/.test(contents)) {
    throw new Error("Merge the live font-scale hook with the custom onConfigurationChanged callback.");
  }
  if (!contents.includes("class MainActivity : ReactActivity()") || !/\n}\s*$/.test(contents)) {
    throw new Error("Live font-scale updates require the generated Kotlin MainActivity.");
  }
  let next = contents;
  for (const name of ["android.content.res.Configuration", "com.facebook.react.bridge.LifecycleEventListener"]) {
    if (!next.includes(`import ${name}`)) {
      next = next.replace(/^(package [^\n]+\n)/, `$1import ${name}\n`);
    }
  }
  return next.replace(/\n}\s*$/, `
  ${marker}
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    // Read resources after Android's configuration dispatch, then remeasure the mounted root.
    window.decorView.post {
      val context = if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        reactHost?.currentReactContext
      } else {
        reactInstanceManager.currentReactContext
      }
      val deviceInfo = context?.getNativeModule("DeviceInfo") as? LifecycleEventListener
      deviceInfo?.onHostResume()
      reactDelegate?.reactRootView?.requestLayout()
    }
  }
}
`);
}

module.exports = (config) => {
  const manifestConfig = withAndroidManifest(config, (mod) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(mod.modResults);
    activity.$["android:configChanges"] = fontScaleConfigChanges(activity.$["android:configChanges"]);
    return mod;
  });
  return withMainActivity(manifestConfig, (mod) => {
    if (mod.modResults.language !== "kt") {
      throw new Error("Live font-scale updates require Kotlin MainActivity.");
    }
    mod.modResults.contents = updateFontScaleActivity(mod.modResults.contents);
    return mod;
  });
};
module.exports.fontScaleConfigChanges = fontScaleConfigChanges;
module.exports.updateFontScaleActivity = updateFontScaleActivity;
