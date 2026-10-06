# Codematica Mobile

Expo Router Android/iOS app for Codematica.

Notebook catalog cards show actual Japanese sheet prompts. Show romaji optionally annotates the prompts and remembers the choice in AsyncStorage separately from ink and progress. Native writing/catalog and storage Jest tests cover restoration and toggling; the Japanese writing Maestro flow exercises the switch.

The app uses `@codematica/core` for content/search/progress contracts and `@codematica/ui` for React Native screens. The bundled core index supports offline discovery, anonymous reading, complete basic hiragana/katakana lookup, romaji/IME-aware search, always-available Japanese flashcards/guides, internal lesson links, dictionary-style character details, and embedded/path writing practice.

Signed-out progress retains every unique item locally. After sign-in, it syncs to the optional Supabase account in bounded batches.

## Local Web And Native Runs

Run the Next web app from the repo root:

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

`expo run:ios` runs prebuild and installs CocoaPods automatically. To inspect or refresh generated iOS pods manually, run:

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
npm run test:mobile:coverage
```

Jest covers native adapters, offline and partial-failure progress behavior, Supabase configuration, app/EAS configuration, and the shared React Native screen matrix. Coverage is enforced at 80% lines/statements/functions and 70% branches for mobile libraries, and 70%/60% for shared native UI.

The game route-focus regression loads the actual map route through its public `@codematica/ui/game` export. Jest maps that export explicitly to the declared screen entry. Native game tests also cover measured art visibility, viewport reflow, covered routes and unchanged-visibility scroll events; artwork and scoring remain unchanged.

Keep SDK 57 patch versions aligned across this workspace, root development dependencies, root overrides, and `package-lock.json`. Install required native peers directly in this app; `expo-audio` requires `expo-asset`. After updating versions, verify a clean `npm ci`, Expo Doctor, typechecking, native coverage, and Android/iOS bundle exports before installed-device checks. Follow the [Expo dependency upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

## Native E2E

Credential-free native E2E builds use the `e2e-test` EAS profile: Android produces an APK and iOS produces a simulator app. Checked-in Maestro flows live in `.maestro/`, use stable `testID` selectors, and cover offline discovery, path-to-practice, browse-to-diagram, Japanese study/review, interviews, unconfigured login, and Restore the Signal. The generated game regression journey covers all 36 scenarios; regenerate it with root `npm run game:flows`. The frontend interview journey also captures Python code for dark-surface visual review. `code-layout.yaml` exercises the lesson code viewport and captures both swipe directions and surrounding prose. Local `code-styles.test.tsx` verifies fenced/indented/nested Markdown, whitespace, language labels, full-height code, and horizontal-scroll containment separately.

Run `npm run mobile:e2e:code-layout -- --session <agent-device-session>` on each Android/iOS phone simulator to assert actual source movement, fixed prose/navigation bounds, reverse scrolling, and vertical page scrolling. See `e2e/README.md` for setup, Expo Go options, and retained screenshot/snapshot artifacts. This local geometry check complements the EAS Maestro screenshots.

`practice-recovery.regression.yaml` covers keyboard correction of a cloze answer and a complete checkpoint/restart. `review-and-recovery.regression.yaml` covers missing-page recovery, passive scroll/source navigation, vocabulary examples, deck reveal/navigation reset and pending audio approval. `skill-review-save.regression.yaml` checks a locally acknowledged rating, process-restart restoration and a second intentional recall. Fault/retry/conflict cases are pinned in native persistence, screen and route tests. These flows need no account or hosted writes.

`guided-lab-and-sources.regression.yaml` checks the ML prerequisite/source companion → guided lab journey, private notes, acknowledged completion, restart and next lesson. Run on disposable installed data at normal and enlarged text. Guided-lab write failures retain choices and notes for Retry completion; progress stores only the existing coarse milestone.

Maestro warm-link flows wait for `mobile-nav-learn` after launching, then open the route. Android activity startup can precede the React navigator's URL subscription. Use a visible readiness assertion, never a fixed delay, and scroll to offscreen path/activity destinations before tapping.

`learn-discovery.regression.yaml` pins compact Learn curated/search cards: fully visible titles and labels, absent description previews, clearing search and the path destination. Run it on the credential-free installed Android/iOS E2E artifact alongside the offline-learning journey. Native Jest also covers resume cards and every curated/search item.

Run the Android smoke workflow manually or by applying the `mobile-e2e` pull-request label:

```bash
npm run mobile:e2e:android
```

Run the Android/iOS release workflow manually; it also triggers on `v*` tag pushes:

```bash
npm run mobile:e2e:release
```

Both workflows pin Maestro 2.8.0 and retain JUnit plus screen recordings. EAS currently classifies its built-in Maestro job as alpha. These workflows build and test only; they never submit or publish an app.

## App Identity

Configure store identity in `app.config.ts` or override it with env vars before creating store records:

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

See `../../docs/runbooks/native-store-publishing.md` for Play Console, Apple Developer Program, App Store Connect, EAS credentials, metadata, and first-release account setup.

References:

- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/eas/workflows/examples/e2e-tests/
- https://docs.expo.dev/eas/workflows/syntax/
- https://docs.expo.dev/submit/introduction/
- https://docs.expo.dev/submit/android/
- https://docs.expo.dev/submit/ios/

## Japanese On iPad

Expo uses adaptive orientation with `supportsTablet` enabled. Japanese handwriting adapts to window size: phones and compact Split View stay stacked; larger iPad windows get a wider canvas.

Review mastery waits for AsyncStorage acknowledgment before showing “saved on this device.” Rating intents share a serialized storage queue; Retry save reuses the same recall, reconciles an already committed write and keeps unrelated skills. Conflicts offer Reload progress; unreadable stored data is preserved. Optional remote loading does not delay local practice. Signed-in sessions validate and merge the remote RLS snapshot before bounded uploads, preserving the local copy. Every lesson, flashcard, dictionary profile, and resource stays directly reachable. Run `npm run content:audio` after adding released Japanese audio to generate Expo's static asset registry.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Restore the Signal

Play (`/`) opens Restore the Signal, Learn (`/learn`) keeps discovery, and `/play/[campaign]/[level]` loads the local chapter. Run root `game:runtime`/`game:assets` before native builds when sources change. All SQLite WASM/worker and textures are bundled. See `docs/features/restore-the-signal.md` for pause/background rules, local awards, and required Android/iOS game regression gates. The Xcode 26.3 limitation remains a release blocker for SDK 57 installed-iOS verification.

Android prebuild uses `plugins/with-shared-bundle-inputs.cjs` so shared source and asset edits invalidate the production JS bundle. See [plugin notes](plugins/README.md) and the game feature document for installed-build verification.

The `with-live-font-scale.cjs` prebuild hook keeps the Android activity and transient navigation/input mounted when system text size changes, and publishes the new scale to responsive React Native screens. Rebuild the native binary to verify it; Expo Go does not include this activity hook. Configuration tests and native coverage pin its generation contract. Installed validation must retain the current route and input while changing text size, then inspect enlarged and restored layouts.

In-level character miniatures use the shared core scene layout and Skia atlas. The scene measures its container, redraws while paused/reduced, and retains a stable `game-scene` testID in the Maestro smoke flow. See the game feature contract for installed-device verification.

## LinkedIn admin review

Verified allowlisted accounts can open More → LinkedIn posts (`/admin/linkedin`). The app uses public Supabase credentials and shared editorial schemas/state; only the local worker has service credentials. `src/__tests__/linkedin-admin.test.tsx` and `admin-access.test.tsx` cover review/auth behavior. `.maestro/linkedin-admin.yaml` requires an installed app already signed into an allowlisted disposable account with publishing disabled. See `docs/runbooks/linkedin-editorial.md`.

The LinkedIn admin screen also supports Create → Add for analysis and selection-based Unicode bold/italic, bullets and plain text. Manual drafts require analyzed proposal adoption before approval; `.maestro/linkedin-admin.yaml` covers creation against disposable data.

Editorial accessibility follows `docs/features/design-system.md`: 48 dp text actions, natural system font scaling, explicit discard before leaving dirty edits, and opt-in `AppScreen` keyboard-aware scrolling. Run native coverage and the disposable-data `.maestro/linkedin-admin.yaml` before native release; on-device screen-reader/keyboard validation is still required. The opt-in `e2e/flows/auth-account.regression.yaml` signs a disposable admin in, exercises that editorial flow, signs out and verifies denied access. Keep publishing disabled, use private Maestro parameters/artifacts and follow `e2e/README.md`; it is separate from credential-free smoke and real OAuth verification.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink and Easy/Balanced/Precise difficulty preferences stay on the device; coarse completion/unlocks optionally sync. Input detection is automatic with no mode buttons; one finger writes, two fingers scroll the paper, and web wheel/trackpad scrolling stays available. Whole characters check automatically after a 400ms pen-up pause, with errors delayed until 1.2 seconds after pen-up. Sheet controls use a visibly labeled restart action with an icon. The installed-app regression flow selects difficulty and draws without a submit button. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

Native notebook writing now protects strokes from ScrollView interception and iPad swipe-back. Selected pages use compact headers and show feedback above the paper; custom creation handles keyboard taps. `src/lib/handwriting-navigation.ts` protects notebook, writing-review, dictionary detail and authored writing-exercise routes while preserving swipe-back elsewhere. Run `npm run mobile:e2e:notebook-layout` and `npm run mobile:e2e:notebook-gestures` against disposable agent-device sessions; see [e2e setup](e2e/README.md). Physical Apple Pencil and SDK 57 build checks were deferred by the user; follow the [physical iPad checklist](../../docs/features/japanese-writing-notebooks.md#deferred-physical-ipad-checklist).

## Account and form design

Native navigation shows account identity and an expandable Sign out action after authentication, with a separate Admin group for verified members. One Supabase client is shared across account, adapters and progress. Local-scope sign out leaves other devices signed in; failed sign out remains retryable. Login uses visible field labels, autofill, busy guards and keyboard-aware scrolling. Apple stays hidden unless `EXPO_PUBLIC_AUTH_APPLE_ENABLED=true`. OAuth callback failures keep a return-to-sign-in action; partial or failed progress sync offers Retry sync without exchanging the one-use code again, or Continue with retained local progress. Source regressions do not replace installed Android/iOS keyboard, screen-reader and large-text validation. See [the app-wide audit](../../docs/features/app-wide-design-audit.md) and [design standards](../../docs/features/design-system.md).

Native OAuth uses explicit PKCE and a validated Expo Router callback handoff. Auth failure stays on a recovery screen; partial progress sync offers retry without reauthenticating. The app-wide route audit distinguishes fresh Metro/Expo Go UI checks from an installed production client and physical Pencil checks.

## Local fuzzy search

The native adapter provides the fixed `src/generated/search-worker.ts` bundle to shared Learn/Browse search. Expensive matching executes in the existing local WebView dependency, keeping native input and scrolling responsive. It needs no network or Supabase setup. Regenerate with `npm run search:runtime` after matcher/runtime changes and verify with `npm run search:check`; CI checks freshness and the root production build regenerates it. Installed performance and startup checks remain required on Android/iOS; mocked component tests are not runtime proof.
