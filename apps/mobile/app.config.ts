import type { ExpoConfig } from "expo/config";

const appName = process.env.EXPO_APP_NAME ?? "Codematica";
const appSlug = process.env.EXPO_APP_SLUG ?? "codematica";
const appScheme = process.env.EXPO_APP_SCHEME ?? "codematica";
const appIdentifier = process.env.EXPO_APP_IDENTIFIER ?? "com.codematica.app";
const appVersion = process.env.EXPO_APP_VERSION ?? "0.1.0";
const iosBuildNumber = process.env.EXPO_IOS_BUILD_NUMBER ?? "1";
const androidVersionCode = Number.parseInt(
  process.env.EXPO_ANDROID_VERSION_CODE ?? "1",
  10
);
const easProjectId =
  process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) {
  throw new Error("EXPO_ANDROID_VERSION_CODE must be a positive integer.");
}

const config: ExpoConfig = {
  name: appName,
  slug: appSlug,
  ...(process.env.EXPO_OWNER ? { owner: process.env.EXPO_OWNER } : {}),
  scheme: appScheme,
  version: appVersion,
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["ios", "android"],
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: appIdentifier,
    buildNumber: iosBuildNumber,
    supportsTablet: true,
    icon: "./assets/icon.png"
  },
  android: {
    package: appIdentifier,
    versionCode: androidVersionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#007c78"
    }
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#007c78",
        image: "./assets/splash.png",
        imageWidth: 200,
        resizeMode: "contain"
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  extra: {
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {})
  }
};

export default config;
