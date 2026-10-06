# Native Mobile Deployment

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-03`
- Owner thread: `n/a`
- Current state: The repo has an Expo Router app in `apps/mobile`, shared runtime logic in `packages/core`, shared React Native screens in `packages/ui`, adaptive phone/iPad Japanese handwriting and review, shared semantic actions and account/recovery controls, Pencil Scribble-compatible open answers, offline Japanese conversion, `expo-audio` playback, enforced Jest coverage, credential-free EAS Android/iOS E2E profiles, and checked-in Maestro regression workflows.
- Target outcome: Codematica can run locally on web/Android/iOS, ship Android and iOS internal builds, and prepare Play Console/App Store Connect submissions while preserving the Next/Vercel mobile web app and sharing product logic.
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

Codematica uses npm workspaces. The Next app lives in `apps/web`. The native Android/iOS app lives in `apps/mobile` and uses Expo Router. Shared content, search, practice, interview, and progress contracts live in `packages/core`; shared React Native-compatible screens and design tokens live in `packages/ui`.

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
- Native block code uses one width-bounded horizontal viewport across Markdown, interviews, reviews, and diagram source. Long source keeps its full height within the vertical page; language labels, prose, and navigation stay fixed during horizontal scrolling. See `markdown-knowledge-browser.md` for the rendering contract.
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

Use the final reverse-DNS identifier before creating store records. Changing `ios.bundleIdentifier` or `android.package` after the first App Store Connect or Play Console app record complicates releases and may require new records.

Store-side setup still required:

- Apple Developer account and App Store Connect app record using `EXPO_APP_IDENTIFIER`.
- Google Play Developer account and Play Console app record using `EXPO_APP_IDENTIFIER`.
- Android signing key and Google service account key configured through EAS credentials.
- iOS distribution certificate/provisioning profile configured through EAS credentials.
- Store listing metadata, screenshots, privacy labels/data-safety forms, age rating, support URL, and review notes.

## Current Implementation

- `apps/mobile/app/` mirrors the web route set for discovery home, section catalogs, path details, browse, docs, diagrams, practice, languages, interviews, login, and OAuth callback.
- `apps/mobile/src/lib/adapters.tsx` adapts Expo Router navigation, native Supabase Auth, and native progress recording to `@codematica/ui`.
- `apps/mobile/src/lib/progress.ts` writes signed-in progress through the shared Supabase/RLS contract, retains all unique signed-out progress locally, and syncs it in 20-item batches, acknowledging only unchanged submitted records after every batch succeeds. Native buffer writes are serialized so concurrent learning remains local.
- `apps/mobile/src/lib/supabase.ts` creates the native Supabase anon client with Expo SecureStore-backed session persistence.
- `apps/mobile/app.config.ts` owns native app identity, adaptive orientation, tablet support, bundle/package identifiers, version counters, icon/splash assets, runtime version policy, and EAS project linkage.
- `apps/mobile/eas.json` owns development, preview, production, e2e-test, and submit profiles.
- `apps/mobile/.eas/workflows/` owns the labeled Android smoke and Android/iOS `v*` release Maestro jobs.
- `apps/mobile/.maestro/` owns the installed-app offline, learning-path, diagram, Japanese, interview, and Auth-disabled journeys.
- `apps/mobile/assets/` stores the native icon, adaptive icon, and splash assets used by app store builds.
- These identity assets now come from the approved Patch brand through `npm run brand:assets`. The iOS icon is opaque; Android uses a transparent foreground and teal background; splash uses the simplified large head on ivory. Shared UI PNGs live under `packages/ui/src/assets/brand/` and are covered by the shared source Gradle input hook. Rebuild native binaries to update launcher/splash resources; see `brand-identity.md`.
- `apps/mobile/app/languages/japanese/**` mirrors the web Japanese lookup/detail/review routes.
- `apps/mobile/src/lib/skill-progress.ts` validates, loads, merges, and uploads Japanese mastery through the anon-safe Supabase client without clearing local state.
- `packages/core/src/` exports content schemas, generated index access, library/discovery search, curated-home resolution, questionnaire logic, handwriting scoring, language helpers, passive flashcard helpers, interview helpers, and progress helpers.
- `packages/ui/src/screens.tsx` exports the shared React Native screen set for current web parity, including Japanese Learn/Review/Dictionary/Resources destinations, complete kana lookup, and writing practice.
- Native writing practice uses `react-native-svg` for the stroke pad and keeps raw strokes transient.
- Native open answers use a real Japanese-language `TextInput`; iPadOS Scribble can replace Pencil handwriting with text on-device. Candidate conversion and grading remain in shared core logic, and raw ink is never stored.
- Approved listening assets play through `expo-audio`; draft synthetic audio is absent from generated registries.
- Japanese writing pads use window dimensions to grow from compact phone/Split View layouts to 480–560 pt iPad canvases while retaining font scaling and 48 pt controls.

## Adaptive Interface

The root layout wraps the existing Stack with safe-area-aware `NativeNavigation`: a phone bottom bar and iPad sidebar, responsive to Split View and font scaling. It preserves route adapters, content, and progress behavior. See [Adaptive Interface And Navigation](adaptive-ui.md).

## Design audit verification

The October 3 design pass is tracked in [app-wide-design-audit.md](app-wide-design-audit.md). A fresh Android Release APK builds and installs on an isolated API 35 emulator; artifact checks verify packaged art and the offline CSS/SQLite runners. Native reader gestures pass on Android and iPhone Expo Go. iPad Expo Go checks cover portrait/landscape notebook entry, real handwriting gestures, Undo and two-finger scrolling, plus learning layouts at default/largest text. Expo Go exercises the SVG handwriting fallback. Xcode 26.3 does not meet the SDK 57 installed-iOS baseline of 26.4. Installed iOS, PencilKit/physical Pencil, native screen readers and complete installed regression lanes remain separate gates. No EAS/store build or submission is authorized by the visual audit.

## Test Plan

- Native card names: discovery buttons include title, visible type/category and displayed difficulty; resume buttons include the type; editorial collection buttons include topic and review status. Component tests pin metadata and exact revision selection. Installed Learn/resume/editorial journeys verify activation at normal and enlarged text. Explicit native accessibility labels override descendant aggregation; actual TalkBack/VoiceOver speech remains a separate acceptance check.

- Software keyboards: `design-controls.test.tsx` dispatches real native keyboard events to `AppScreen` on both platforms, verifies the reserved height/padding and restoration, and keeps the same input. `game.test.tsx` pins Android editor identity through the same transition. Installed acceptance must show exact CSS/SQL text above the open keyboard, execute the solutions, and retain map/list/current-level assertions. Window resize configuration or a source-only pass does not prove keyboard geometry.

- Configured account: the opt-in `e2e/flows/auth-account.regression.yaml` uses only disposable local data with publishing disabled. Run at normal and enlarged text, retaining invalid-password recovery, acknowledged sign-in, account/Admin navigation, manual creation/refinement, sign-out and access denial. Its page-edge swipe makes the below-field confirmation reachable before the original bounded search; an additional bounded scroll brings the expanded account email into view. Follow the [native E2E guide](../../apps/mobile/e2e/README.md#configured-account-and-editorial-journey); preserve failed results and inspect viewport crops separately from assertions.

- Native code: `code-styles.test.tsx` covers source preservation, nested Markdown, readable code/inline styles, and scroll containment. Run `npm run mobile:e2e:code-layout -- --session <agent-device-session>` on both platforms for geometry and real gesture assertions; `apps/mobile/e2e/README.md` documents setup and evidence. `.maestro/code-layout.yaml` runs in the existing EAS release lane and captures source/prose screenshots. Expo Go validation does not replace the final EAS build checks.

- `code-styles.test.tsx` verifies dark fenced and indented Markdown, unknown languages, standalone code, and separate inline styling. The frontend Maestro journey captures Python source for installed-device visual review; Jest success alone does not establish native visual contrast on a device.

- Navigation: `adaptive-navigation.test.tsx` proves compact menu and tablet destinations; `.maestro/adaptive-navigation.yaml` must pass on Android and iOS before native release.

- Core: `npm run typecheck -w @codematica/core` and `npm test` for generated index, route helpers, search, practice, and progress contracts.
- UI/mobile: `npm run typecheck -w @codematica/ui`, `npm run typecheck -w @codematica/mobile`, and `npm run test:mobile:coverage` for adapters, failure/retry behavior, configuration, and the complete shared-screen matrix. Preserve learner-facing practice labels and the missing-Supabase explanation in disabled sign-in states.
- Web: `npm run typecheck -w @codematica/web`, `npm test`, and `npm run e2e:smoke` for the existing web mobile workflow.
- Content: `npm run content:check` after content, parser, schema, or generated index changes.
- Expo: `npm run doctor -w @codematica/mobile` before EAS build work.
- Dependency updates: align SDK 57 versions across mobile dependencies, root development dependencies/overrides, and the lockfile. Declare native peers directly, including `expo-asset` for `expo-audio`. Verify `npm ci`, Doctor, typechecking, Jest coverage, and `npx expo export --platform all` from `apps/mobile`; bundle export does not prove installed-app startup or native binary compatibility.
- Native warm-deep-link flows first assert the shared navigation is visible after launch. Android launch completion precedes React navigator readiness; sending the link immediately lost the event in local Release checks. Wait for UI state, not a fixed delay. Scroll to destinations outside the viewport before interacting.
- Native E2E: apply the `mobile-e2e` PR label or run `npm run mobile:e2e:android` for Android smoke. A `v*` tag or `npm run mobile:e2e:release` builds credential-free Android/iOS artifacts and runs all Maestro flows with JUnit and recordings.
- Build: `npm run build` for the web app; `npm run mobile:build:preview` for internal native testers; `npm run mobile:build:android` and `npm run mobile:build:ios` for store-ready artifacts once EAS credentials are configured.

## Known Gaps

- The 2026-09-05 Expo preview failed on missing `expo-router/_ctx-shared` and SDK patch mismatches. After dependency alignment on 2026-09-29, Expo Doctor passes 20/20 and Android/iOS bundle exports pass. Installed-device startup and visual readiness still require verification.

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

## Restore the Signal runtime and packaging

The native home is the campaign map; discovery remains at `/learn`. `packages/ui/src/game/` renders ordinary native controls around Skia actors and district layers. CSS geometry and bundled SQLite execute in local WebViews with no remote service. See [Restore the Signal](restore-the-signal.md) for the chapter, pause, awards, assistance, and offline contract.

`plugins/with-shared-bundle-inputs.cjs` extends the generated Android bundle task’s inputs to include shared package source and game assets. Metro watch folders alone do not invalidate Gradle’s cached production bundle. Keep this hook when updating Expo’s generated projects. The local release check uses `app:assembleRelease` with a 6 GB Gradle heap, 2 GB metaspace, and four workers; the generated default 512 MB metaspace was insufficient for the added renderers on this host.

`plugins/with-live-font-scale.cjs` preserves the running Android activity when system font scale changes. It adds only the `fontScale` configuration flag and forwards the configuration callback. A posted refresh reads the updated resources, refreshes React Native DeviceInfo, and remeasures the mounted React root without recreating the activity or reloading JavaScript. Existing flags and activity identity remain intact. The hook supports Expo's generated Kotlin activity and fails on a conflicting custom callback. Configuration tests run the real Expo mods and pin idempotence/import preservation; native coverage includes the hook. A newly compiled and installed APK must retain the current route and populated input through enlargement and restoration. This is separate from cold-launch large-text checks and cannot be established with Expo Go. Shared `AdaptiveText` refreshes native text nodes at a changed font scale, preserving their parent screens and form inputs; Markdown text reparses on dimension changes without resetting sibling diagrams. Native integration tests verify live Learn query/results and Markdown/diagram state, and installed captures must verify the actual reflow.

The generated `game-chapter.regression.yaml` exercises all 36 scenarios, real editors, touch connections, persistence, live background/resume, and Android airplane mode. `setAirplaneMode` has no effect on iOS Simulator, so offline iOS verification also requires a network-disabled test host/device. The first two scenarios have a short smoke flow. Keep failed Maestro reports and recordings. Current installed-device evidence and outstanding gates are recorded in the game feature doc.

## Frontend Interview Study Flow (2026-09-27)

Native supports the same seven guides, revealed recipes, TypeScript/Python source, quizzes, and final continuous feed. Source execution remains web-only. The interview route passes path-aware next-node destinations; source-lesson links retain path queries. Jest covers the guide and language switch, and `.maestro/frontend-interview.yaml` joins the existing release-directory lane. Local verification found ten existing Expo patch mismatches; installed Android/iOS Maestro verification remains required before release.

## Japanese notebook update — 2026-10-02

Languages exposes Japanese and Notebook practice in the tablet/sidebar and phone More menus. `/languages/japanese/notebooks` supports curated and custom 1–5-character prompts and saved pages. [Japanese writing notebooks](japanese-writing-notebooks.md) owns the shared 24-repetition engine, device-local ink, maximum-progress synchronization and validation gates. Live ink and feedback preserve page position; Input is detected automatically. Mouse wheel/trackpad scrolling remains available on web; two-finger gestures scroll the paper on touch screens and installed apps without adding ink. There are no Draw, Pen or Scroll buttons.

The local `apps/mobile/modules/codematica-handwriting` Expo module wraps PencilKit and must be included in a new native binary. Expo Go and older binaries use the SVG fallback. JavaScript imports public native-module helpers from the direct `expo` dependency. The pod declares ExpoModulesCore and PencilKit explicitly. Xcode 26.3 cannot establish SDK 57 native readiness; rerun with Xcode 26.4+ and execute Maestro on both platforms, then physical Pencil/palm/pressure QA. Autolinking and Swift syntax checks are not a build or physical-device validation.

The device pass adds native notebook layout/contact runners under `apps/mobile/e2e/`. They exercise real SVG fallback input in Expo Go on Android, iPhone and iPad; they do not validate the installed PencilKit module. The shell disables native swipe-back on handwriting routes to keep rightward strokes from leaving the page. Native paper blocks ScrollView interception and uses explicit two-finger/accessibility scrolling. A compact selected-page header and feedback above the paper preserve useful phone writing space. Supported builds, installed Maestro and physical Pencil checks are deferred; use the [notebook checklist](japanese-writing-notebooks.md#deferred-physical-ipad-checklist).
