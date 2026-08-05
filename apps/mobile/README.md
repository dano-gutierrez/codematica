# Codematica Mobile

Expo Router Android/iOS app for Codematica.

The app consumes `@codematica/core` for content/search/progress contracts and `@codematica/ui` for React Native screens. Content is bundled from the generated core index so discovery, anonymous reading, complete basic hiragana/katakana lookup, romaji/IME-aware search, always-available Japanese flashcards/guides, internal lesson links, dictionary-style character details, and embedded/path writing practice work offline. Signed-out progress retains every unique item locally and syncs to the optional Supabase account in bounded batches after sign-in.

## Local Web And Native Runs

From the repo root, the unchanged web app still runs through the Next workspace:

```bash
npm install
npm run content:index
npm run dev
```

Open `http://127.0.0.1:3100`.

Start the Expo dev server:

```bash
npm run mobile:dev
```

Run native development builds locally:

```bash
npm run mobile:android
npm run mobile:ios
```

`expo run:ios` performs prebuild and CocoaPods installation automatically. If you need to inspect or refresh generated iOS pods manually, run:

```bash
npm run mobile:prebuild:ios
npm run mobile:pods
```

Generated `apps/mobile/ios/` and `apps/mobile/android/` folders are ignored. Keep them generated unless the project intentionally switches to checked-in native projects.

## Validation

```bash
npm run mobile:doctor
npm run typecheck -w @codematica/mobile
npm run test:mobile
```

## App Identity

Store identity is configured in `app.config.ts` and can be overridden with env vars before the first store records are created:

```bash
EXPO_APP_NAME=Codematica
EXPO_APP_SLUG=codematica
EXPO_APP_SCHEME=codematica
EXPO_APP_IDENTIFIER=com.codematica.app
EXPO_APP_VERSION=0.1.0
EXPO_IOS_BUILD_NUMBER=1
EXPO_ANDROID_VERSION_CODE=1
EXPO_OWNER=your-expo-account
EAS_PROJECT_ID=your-eas-project-id
```

Use one final reverse-DNS identifier for both `ios.bundleIdentifier` and `android.package`. Change it before creating App Store Connect and Play Console app records if `com.codematica.app` is not the identifier you intend to own long term.

## EAS Account And Credentials

Login and link the Expo project:

```bash
npm run mobile:eas:login
npm run mobile:eas:init
```

Configure signing credentials:

```bash
npm run mobile:credentials:android
npm run mobile:credentials:ios
```

For Android store submission, create the Play Console app, create a Google service account key, and upload that key to EAS credentials. Keep JSON keys under `apps/mobile/credentials/` only if you need a local copy; that folder is ignored.

For iOS store submission, create the App Store Connect app with the same bundle identifier and let EAS manage distribution certificates/provisioning profiles, or connect your Apple credentials during `eas credentials`.

## EAS Builds

Internal preview build for testers:

```bash
npm run mobile:build:preview
```

Store-ready production builds:

```bash
npm run mobile:build:android
npm run mobile:build:ios
npm run mobile:build:all
```

Android production builds use an `.aab` app bundle. iOS production builds upload an archive suitable for App Store Connect/TestFlight.

## Store Submission

Submit the latest production builds through EAS Submit:

```bash
npm run mobile:submit:android
npm run mobile:submit:ios
npm run mobile:submit:all
```

The checked-in submit profile sends Android builds to the Play internal track first. Move to alpha, beta, or production only after Play Console metadata, screenshots, privacy/data-safety forms, and tester/release settings are ready. iOS submissions go to App Store Connect/TestFlight; release to the public App Store still requires selecting the build and submitting it for App Review in App Store Connect.

Full Play Console, Apple Developer Program, App Store Connect, EAS credentials, metadata, and first-release account setup steps are documented in `../../docs/runbooks/native-store-publishing.md`.

References:

- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/submit/introduction/
- https://docs.expo.dev/submit/android/
- https://docs.expo.dev/submit/ios/

## Japanese On iPad

Expo orientation is adaptive and `supportsTablet` remains enabled. Japanese handwriting uses window dimensions so compact phone and Split View remain stacked while larger iPad windows receive a wider canvas. Review mastery is stored immediately with AsyncStorage; signed-in sessions validate and merge the remote RLS snapshot before bounded uploads, without clearing the local copy. Every lesson, flashcard, dictionary profile, and resource remains directly reachable. Run `npm run content:audio` after adding released Japanese audio so Expo receives a static asset registry.
