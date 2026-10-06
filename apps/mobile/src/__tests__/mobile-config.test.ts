import easConfig from "../../eas.json";

describe("native app and EAS configuration", () => {
  const envKeys = [
    "EXPO_APP_NAME",
    "EXPO_APP_SLUG",
    "EXPO_APP_SCHEME",
    "EXPO_APP_IDENTIFIER",
    "EXPO_APP_VERSION",
    "EXPO_IOS_BUILD_NUMBER",
    "EXPO_ANDROID_VERSION_CODE",
    "EXPO_OWNER",
    "EAS_PROJECT_ID",
    "EXPO_PUBLIC_EAS_PROJECT_ID",
  ] as const;
  const original = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of envKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    jest.resetModules();
  });

  it("uses stable local-first defaults and adaptive native layout", () => {
    let config: typeof import("../../app.config").default | undefined;
    jest.isolateModules(() => {
      // Jest's isolated module cache is CommonJS under the Expo preset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      config = require("../../app.config").default;
    });

    expect(config).toMatchObject({
      name: "Codematica",
      slug: "codematica",
      scheme: "codematica",
      orientation: "default",
      platforms: ["ios", "android"],
      ios: { bundleIdentifier: "com.codematica.app", supportsTablet: true },
      android: { package: "com.codematica.app", versionCode: 1 },
      runtimeVersion: { policy: "appVersion" },
    });
  });

  it("accepts release identity overrides and rejects invalid Android versions", () => {
    process.env.EXPO_APP_IDENTIFIER = "dev.codematica.test";
    process.env.EXPO_ANDROID_VERSION_CODE = "42";
    process.env.EAS_PROJECT_ID = "project-1";
    jest.isolateModules(() => {
      // Jest's isolated module cache is CommonJS under the Expo preset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const config = require("../../app.config").default;
      expect(config.android).toMatchObject({ package: "dev.codematica.test", versionCode: 42 });
      expect(config.ios).toMatchObject({ bundleIdentifier: "dev.codematica.test" });
      expect(config.extra).toEqual({ eas: { projectId: "project-1" } });
    });

    jest.resetModules();
    process.env.EXPO_ANDROID_VERSION_CODE = "0";
    expect(() => {
      // Jest's isolated module cache is CommonJS under the Expo preset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../app.config");
    }).toThrow("EXPO_ANDROID_VERSION_CODE must be a positive integer.");
  });

  it("keeps E2E builds credential-free and non-submitting", () => {
    expect(easConfig.build["e2e-test"]).toEqual({
      withoutCredentials: true,
      channel: "e2e-test",
      android: { buildType: "apk" },
      ios: { simulator: true },
    });
    expect(easConfig.submit).not.toHaveProperty("e2e-test");
  });
});

test('prebuild registers shared source and asset inputs without duplicating the Gradle hook',()=>{
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const {sharedBundleInputs}=require('../../plugins/with-shared-bundle-inputs.cjs');
 const source='apply plugin: "com.facebook.react"\n';
 const next=sharedBundleInputs(source);
 expect(next).toContain('*/src/**');expect(next).toContain('assets/game');
 expect(next.startsWith(source)).toBe(true);expect(sharedBundleInputs(next)).toBe(next);
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 expect(require('../../app.config').default.plugins).toContain('./plugins/with-shared-bundle-inputs.cjs');
});


describe("live Android font-size configuration", () => {
  const mainActivity = `package com.codematica.app
import android.os.Bundle
class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(null) }
}
`;

  function helpers() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../../plugins/with-live-font-scale.cjs");
  }

  it("keeps font-size changes in the running activity without removing other handled changes", () => {
    const { fontScaleConfigChanges } = helpers();
    expect(fontScaleConfigChanges("keyboard|orientation|screenSize|assetsPaths"))
      .toBe("keyboard|orientation|screenSize|assetsPaths|fontScale");
    expect(fontScaleConfigChanges(undefined)).toBe("fontScale");
    expect(fontScaleConfigChanges("fontScale|orientation"))
      .toBe("fontScale|orientation");
  });

  it("updates React Native dimensions through its existing device-info module", () => {
    const { updateFontScaleActivity } = helpers();
    const next = updateFontScaleActivity(mainActivity);
    expect(next).toContain("super.onConfigurationChanged(newConfig)");
    expect(next).toContain("BuildConfig.IS_NEW_ARCHITECTURE_ENABLED");
    expect(next).toContain("reactHost?.currentReactContext");
    expect(next).toContain("reactInstanceManager.currentReactContext");
    expect(next).toContain('getNativeModule("DeviceInfo") as? LifecycleEventListener');
    expect(next).toContain("deviceInfo?.onHostResume()");
    expect(next).not.toContain("DeviceInfoModule");
    expect(next).toContain("super.onCreate(null)");
    expect(updateFontScaleActivity(next)).toBe(next);
  });

  it("refreshes the mounted root after Android finishes updating configuration resources", () => {
    const { updateFontScaleActivity } = helpers();
    const next = updateFontScaleActivity(mainActivity);
    const callback = next.slice(next.indexOf("override fun onConfigurationChanged"));
    expect(callback).toMatch(/super\.onConfigurationChanged\(newConfig\)[\s\S]*window\.decorView\.post \{[\s\S]*val context/);
    expect(callback).toContain("reactDelegate?.reactRootView?.requestLayout()");
    expect(callback).not.toContain("recreate()");
    expect(callback).not.toContain("reload(");
  });

  it("preserves existing imports and fails instead of replacing a custom callback", () => {
    const { updateFontScaleActivity } = helpers();
    const withImports = mainActivity.replace("import android.os.Bundle", "import android.os.Bundle\nimport android.content.res.Configuration\nimport com.facebook.react.bridge.LifecycleEventListener");
    const next = updateFontScaleActivity(withImports);
    expect(next.match(/import android.content.res.Configuration/g)).toHaveLength(1);
    expect(next.match(/import com.facebook.react.bridge.LifecycleEventListener/g)).toHaveLength(1);
    expect(() => updateFontScaleActivity(mainActivity.replace("  override fun onCreate", "  override fun onConfigurationChanged(newConfig: Configuration) {}\n  override fun onCreate"))).toThrow("custom onConfigurationChanged");
    expect(() => updateFontScaleActivity("class OtherActivity {}\n")).toThrow("MainActivity");
  });

  it("applies both real Expo mods and leaves other activities unchanged", async () => {
    const plugin = helpers();
    const configured = plugin({ name: "Test", slug: "test" });
    const manifest = { manifest: { application: [{ activity: [
      { $: { "android:name": ".OtherActivity", "android:configChanges": "orientation" } },
      { $: { "android:name": ".MainActivity", "android:configChanges": "keyboard|orientation", "android:launchMode": "singleTask" } },
    ] }] } };
    const result = await configured.mods.android.manifest({ ...configured, modResults: manifest });
    expect(result.modResults.manifest.application[0].activity[0].$["android:configChanges"]).toBe("orientation");
    expect(result.modResults.manifest.application[0].activity[1].$).toEqual({
      "android:name": ".MainActivity", "android:configChanges": "keyboard|orientation|fontScale", "android:launchMode": "singleTask",
    });
    const activity = await configured.mods.android.mainActivity({ ...configured, modResults: { language: "kt", contents: mainActivity } });
    expect(activity.modResults.contents).toContain("override fun onConfigurationChanged");
    await expect(configured.mods.android.mainActivity({ ...configured, modResults: { language: "java", contents: "class MainActivity {}" } })).rejects.toThrow("Kotlin MainActivity");
  });

  it("registers the font-size prebuild hook", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(require("../../app.config").default.plugins).toContain("./plugins/with-live-font-scale.cjs");
  });
});
