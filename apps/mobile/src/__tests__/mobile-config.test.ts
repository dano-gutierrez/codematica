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
