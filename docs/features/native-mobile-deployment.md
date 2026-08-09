# Native Mobile Deployment

## Snapshot

- Status: `in_progress`
- Last updated: `2026-08-05`
- Owner thread: `n/a`
- Current state: The repo has an Expo Router app in `apps/mobile`, shared runtime logic in `packages/core`, shared React Native screens in `packages/ui`, adaptive phone/iPad Japanese handwriting and review, Pencil Scribble-compatible open answers, offline Japanese conversion, `expo-audio` playback, enforced Jest coverage, credential-free EAS Android/iOS E2E profiles, and checked-in Maestro regression workflows.
- Target outcome: Codematica can run locally on web/Android/iOS, ship Android and iOS internal builds, and prepare Play Console/App Store Connect submissions while preserving the existing Next/Vercel mobile web app and coding shared product behavior once.
- Code touchpoints:
  - `apps/mobile/`
  - `packages/core/`
  - `packages/ui/`
  - `apps/web/`
- Primary tests:
  - `packages/core/src/core.test.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`
  - `apps/web/e2e/specs/knowledge-browser.smoke.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screen-matrix.test.tsx`
  - `apps/mobile/.maestro/`

## One-Minute Brief

Codematica now uses an npm workspace model. The existing Next app lives in `apps/web`. The native Android/iOS app lives in `apps/mobile` and uses Expo Router. Shared content, search, practice, interview, and progress contracts live in `packages/core`; shared React Native-compatible screens and design tokens live in `packages/ui`.

The native app bundles `packages/core/src/generated/content-index.json`, so home discovery, cross-section search, browsing, reading, language lookup, and practice work offline until the next app or update release. Supabase remains optional for anonymous use and is used only for native Auth/progress sync when anon-safe `EXPO_PUBLIC_*` env vars are configured.

Detailed Play Console, Apple Developer Program, App Store Connect, EAS credential, metadata, and first-release steps live in `docs/runbooks/native-store-publishing.md`.

## Outcome / Contract

- Keep web production on Next/Vercel; do not replace it with Expo web.
- Keep native app routing in Expo Router with paths that mirror the web route contract.
- Keep Markdown, diagrams, learning paths, exercises, flashcard feeds, and interviews canonical in root `content/`.
- Generate the shared runtime index with `npm run content:index`; do not hand-edit `packages/core/src/generated/content-index.json`.
- Keep shared business logic in `@codematica/core`; platform code should call adapters instead of duplicating route, search, practice, or progress rules.
- Keep reusable native screens in `@codematica/ui` using React Native primitives, design tokens, and `StyleSheet`.
- Native Supabase uses anon-safe public env vars and secure Expo session storage. Service role keys remain local/server-only.
- Native Mermaid rendering uses a WebView when a bundled Mermaid runtime is provided and shows source fallback when unavailable.
- Native real-world web interviews include complete rubrics, approaches, and selectable source files, but deliberately defer editing/execution to the Next.js Sandpack surface.
- Native Japanese study keeps Learn, Review, Dictionary, and Resources directly reachable; review state is retained in AsyncStorage and merged with the authenticated RLS snapshot when Supabase is configured.
- Expo orientation is adaptive with tablet support enabled. Writing canvases size from the active window rather than assuming a fixed phone width, so Split View and portrait/landscape iPad layouts remain usable.
- First release target is EAS internal distribution. Store submission readiness is configured in the repo, but actual Play Console/App Store Connect release requires account-owned app records, credentials, metadata, screenshots, and review forms outside the repo.
- Native E2E uses the credential-free `e2e-test` profile: APK for Android and simulator app for iOS. A PR labeled `mobile-e2e` runs Android smoke; a `v*` tag runs every Maestro flow on Android and iOS. These workflows never submit or publish builds.

## Run And Build Commands

Web remains the Next/Vercel target:

```bash
npm install
npm run content:index
npm run dev
```

Open `http://127.0.0.1:3100`.

Native local development:

```bash
npm run mobile:dev
npm run mobile:android
npm run mobile:ios
```

`npm run mobile:ios` runs Expo prebuild and CocoaPods automatically. To refresh generated iOS pods manually:

```bash
npm run mobile:prebuild:ios
npm run mobile:pods
```

EAS setup and credential management:

```bash
npm run mobile:eas:login
npm run mobile:eas:init
npm run mobile:credentials:android
npm run mobile:credentials:ios
```

EAS builds:

```bash
npm run mobile:build:preview
npm run mobile:build:android
npm run mobile:build:ios
npm run mobile:build:all
```

Native E2E workflows:

```bash
npm run mobile:e2e:android
npm run mobile:e2e:release
```

EAS submissions:

```bash
npm run mobile:submit:android
npm run mobile:submit:ios
npm run mobile:submit:all
```

Android production builds use `.aab` app bundles and submit to the Play internal track by default. iOS submissions go to App Store Connect/TestFlight; public App Store release still requires selecting the uploaded build and submitting it for App Review in App Store Connect.

## Store Identity And Release Inputs

`apps/mobile/app.config.ts` reads these optional env vars before falling back to repo defaults:

```bash
EXPO_APP_NAME=Codematica
EXPO_APP_SLUG=codematica
EXPO_APP_SCHEME=codematica
EXPO_APP_IDENTIFIER=com.codematica.app
EXPO_APP_VERSION=0.1.0
EXPO_IOS_BUILD_NUMBER=1
EXPO_ANDROID_VERSION_CODE=1
EXPO_OWNER=
EAS_PROJECT_ID=
```

Use the final reverse-DNS identifier before creating store records. Changing `ios.bundleIdentifier` or `android.package` after the first App Store Connect or Play Console app record creates release-management friction and may require new records.

Store-side setup still required:

- Apple Developer account and App Store Connect app record using `EXPO_APP_IDENTIFIER`.
- Google Play Developer account and Play Console app record using `EXPO_APP_IDENTIFIER`.
- Android signing key and Google service account key configured through EAS credentials.
- iOS distribution certificate/provisioning profile configured through EAS credentials.
- Store listing metadata, screenshots, privacy labels/data-safety forms, age rating, support URL, and review notes.

## Current Implementation

- `apps/mobile/app/` mirrors the web route set for discovery home, section catalogs, path details, browse, docs, diagrams, practice, languages, interviews, login, and OAuth callback.
- `apps/mobile/src/lib/adapters.tsx` adapts Expo Router navigation, native Supabase Auth, and native progress recording to `@codematica/ui`.
- `apps/mobile/src/lib/progress.ts` writes signed-in progress through the shared Supabase/RLS contract, retains all unique signed-out progress locally, and syncs it in 20-item batches without clearing until every batch succeeds.
- `apps/mobile/src/lib/supabase.ts` creates the native Supabase anon client with Expo SecureStore-backed session persistence.
- `apps/mobile/app.config.ts` owns native app identity, adaptive orientation, tablet support, bundle/package identifiers, version counters, icon/splash assets, runtime version policy, and EAS project linkage.
- `apps/mobile/eas.json` owns development, preview, production, e2e-test, and submit profiles.
- `apps/mobile/.eas/workflows/` owns the labeled Android smoke and Android/iOS `v*` release Maestro jobs.
- `apps/mobile/.maestro/` owns the installed-app offline, learning-path, diagram, Japanese, interview, and Auth-disabled journeys.
- `apps/mobile/assets/` stores the native icon, adaptive icon, and splash assets used by app store builds.
- `apps/mobile/app/languages/japanese/**` mirrors the web Japanese lookup/detail/review routes.
- `apps/mobile/src/lib/skill-progress.ts` validates, loads, merges, and uploads Japanese mastery through the anon-safe Supabase client without clearing local state.
- `packages/core/src/` exports content schemas, generated index access, library/discovery search, curated-home resolution, questionnaire logic, handwriting scoring, language helpers, passive flashcard helpers, interview helpers, and progress helpers.
- `packages/ui/src/screens.tsx` exports the shared React Native screen set for current web parity, including Japanese Learn/Review/Dictionary/Resources destinations, complete kana lookup, and writing practice.
- Native writing practice uses `react-native-svg` for the stroke pad and keeps raw strokes transient.
- Native open answers use a real Japanese-language `TextInput`; iPadOS Scribble can replace Pencil handwriting with text on-device. Candidate conversion and grading remain in shared core logic, and raw ink is never stored.
- Approved listening assets play through `expo-audio`; draft synthetic audio is absent from generated registries.
- Japanese writing pads use window dimensions to grow from compact phone/Split View layouts to 480–560 pt iPad canvases while retaining font scaling and 44 pt controls.

## Test Plan

- Core: `npm run typecheck -w @codematica/core` and `npm test` for generated index, route helpers, search, practice, and progress contracts.
- UI/mobile: `npm run typecheck -w @codematica/ui`, `npm run typecheck -w @codematica/mobile`, and `npm run test:mobile:coverage` for adapters, failure/retry behavior, configuration, and the complete shared-screen matrix.
- Web: `npm run typecheck -w @codematica/web`, `npm test`, and `npm run e2e:smoke` for the existing web mobile workflow.
- Content: `npm run content:check` after content, parser, schema, or generated index changes.
- Expo: `npm run doctor -w @codematica/mobile` before EAS build work.
- Native E2E: apply the `mobile-e2e` PR label or run `npm run mobile:e2e:android` for Android smoke. A `v*` tag or `npm run mobile:e2e:release` builds credential-free Android/iOS artifacts and runs all Maestro flows with JUnit and recordings.
- Build: `npm run build` for the web app; `npm run mobile:build:preview` for internal native testers; `npm run mobile:build:android` and `npm run mobile:build:ios` for store-ready artifacts once EAS credentials are configured.

## Known Gaps

- The local iPad simulator build reaches native compilation but Xcode 26.3 fails inside ExpoModulesJSI. Expo SDK 57 documents Xcode 26.4+ as its supported baseline; rerun the build after upgrading Xcode rather than patching generated dependency source.
- Native WebView Mermaid currently falls back to source unless a bundled Mermaid runtime string is supplied to the shared adapter.
- React/TypeScript web exercise projects are read-only on native; there is no native WebView compiler/runtime.
- EAS's built-in Maestro workflow job is currently alpha; revalidate its schema when Expo changes that contract.
- The checked-in EAS workflow definitions require an authenticated, linked Expo project for remote validation/execution; local Jest and Maestro-flow source remain credential-free.
- Store submission metadata, screenshots, privacy labels, and app review preparation remain account-side work and are not stored in this repo yet.
- Public production release remains manual after EAS submission: Play internal track promotion happens in Play Console, and iOS App Store release happens in App Store Connect after TestFlight processing and App Review submission.

## Decision Log

- `2026-07-11`: Keep Next/Vercel as the web deployment and add Expo Router for native instead of moving all targets to Expo web.
- `2026-07-11`: Use npm workspaces with `apps/web`, `apps/mobile`, `packages/core`, and `packages/ui`.
- `2026-07-11`: Bundle the generated content index into native for offline anonymous study.
- `2026-07-11`: Use React Native primitives and `StyleSheet` for shared native UI rather than NativeWind or a larger UI framework.
- `2026-07-11`: Use `react-native-svg` for native handwriting practice while keeping scoring in shared core logic.
- `2026-07-11`: Target EAS internal builds first; configure store-ready app identity, EAS production build profiles, and EAS submit profiles so Play Console/App Store Connect publishing can start after account setup.
- `2026-08-03`: Keep Japanese alphabet resources accessible from the native hub and make native anonymous progress retention/sync lossless across bounded batches.
- `2026-08-04`: Add adaptive orientation, responsive iPad handwriting, Japanese review/resources, language accessibility hints, and authenticated mastery merging; align Expo SDK dependencies and pass Expo Doctor 20/20.
- `2026-08-05`: Enforce native Jest coverage and add Maestro 2.8.0 Android smoke plus Android/iOS release-candidate workflows using credential-free E2E builds.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, and docs/features/native-mobile-deployment.md first. Compare the native contract against apps/mobile, packages/core, packages/ui, package.json workspace scripts, and .env.example. Preserve Next/Vercel web behavior while adding native changes, keep Supabase optional for anonymous browsing, and update tests/docs with any behavior changes.`
