# Web End-To-End Tests

Playwright runs the complete suite in mobile Chromium. Critical `@smoke` journeys, `@playground`, `@notebook-catalog`, and `@design` regressions also run in desktop Chromium and mobile WebKit. Deeper cases use `@regression`.

The runner builds and serves the production Next app, avoiding dev-server compilation and Fast Refresh during parallel tests. CI uses two workers overall; local runs use four. Each iPhone WebKit project uses one worker. The public foundations, Japanese and campaign matrices use a fresh worker per feature/width; their interaction cases form a separate project. This bounds worker reuse after the audit observed a navigation/teardown stall roughly every 47 cases. Editorial keeps its original three projects. All cases, assertions, timeouts, videos and traces remain enabled; a before/after listing verifies that the same cases are selected once each.

Set `E2E_PORT=3102` (or another free port) when a local app owns the default 3100. The server and browser base URL use the same port.

```bash
npm run e2e:web:smoke
npm run e2e:web:regression
npm run e2e:web:release
# Complete WebKit lane, including its responsive worker groups
E2E_PORT=3102 npx playwright test --config=apps/web/e2e/playwright.config.ts --project='mobile-webkit*' --workers=1
```

Specs live in `specs/` and use `*.smoke.spec.ts` or `*.regression.spec.ts`. Use role queries or stable `data-testid` values; do not use CSS selectors or fixed waits. Failures retain traces, screenshots, and video in `test-results/artifacts/`. JUnit output goes to `test-results/junit.xml`; the HTML report goes to `playwright-report/`.

The durable matrix, CI schedules, and release contract live in `docs/features/automated-testing-and-release-regression.md`.

`code-contrast.regression.spec.ts` verifies the actual CSS cascade for lessons at phone/desktop widths, all algorithm languages, Python companions, review snippets, SQL/plain code, Mermaid source, and edited playground syntax. It measures code text against the dark surface (including the faint grid lines), protects inline-code styling, and blocks hosted execution for editor-only checks. Run with `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium apps/web/e2e/specs/code-contrast.regression.spec.ts`.

`playground.regression.spec.ts` verifies automatic startup, one runtime shared with the console, edited code execution, actual Reset output, and recovery with edits after a blocked hosted-runtime connection. Run it with `npx playwright test --config=apps/web/e2e/playwright.config.ts apps/web/e2e/specs/playground.regression.spec.ts`. It advances the browser clock for the connection deadline; it does not sleep or inject fake application state. Generated reports under `apps/web/e2e/` are excluded from lint, not deleted.

The app-wide `@design` lane adds responsive route matrices for foundations, discovery/interviews, Japanese practice and every campaign level. It includes enlarged-text, full-page overflow, axe and touch-target checks plus explicit recovery/return journeys. Run the full release lane for final verification; synthetic editorial cases remain in their separate `EDITORIAL_E2E=1` lane. Preserve failed traces and reports before a rerun overwrites the output directory.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. The adaptive UI reuses existing screens and feature logic. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Editorial regression lane

The design regression checks synthetic drafts at 320–1440 px, keyboard tooltips, axe accessibility, collapsed details, unsaved-edit protection, and explicit discard. It captures desktop and phone reference images. Preserve failed traces and reports separately before rerunning this lane.

Clipboard recovery uses a denied synthetic browser API and verifies that the comment remains available without a database write. Proposal reflow includes a long unbroken source URL, not only short fixture paragraphs.

`account-navigation.regression.spec.ts` also runs in `npm run e2e:linkedin`: desktop/phone sign-in, Admin/LinkedIn grouping, account disclosure, Escape focus, local sign-out, and cookie removal. Its identity and tokens are synthetic and only used against the fake Supabase host.

`npm run e2e:linkedin` sets `EDITORIAL_E2E=1` and runs the admin review/refinement/approval and denied-access journey with a fake Supabase URL/key and intercepted RPCs. It makes no hosted database writes. This spec is skipped outside the dedicated lane. Default public smoke/release lanes explicitly clear public Supabase config so local credentials cannot change signed-out expectations. Run both `npm run e2e:smoke` and `npm run e2e:linkedin`.

`E2E_PORT=3102 npm run e2e:linkedin:accessibility` runs isolated synthetic editorial reflow/axe, touch labels/48 px targets, desktop tooltip dismissal, focus recovery and 200% text checks on mobile Chromium, desktop Chromium and iPhone WebKit. The six widths include portrait and landscape tablet layouts; no RPC mutation is allowed. Results remain in the editorial report directory. These tests do not replace installed native VoiceOver/TalkBack or software-keyboard checks.

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Restore the Signal

`ml-systems.regression.spec.ts` is also in the `@design` lane. It verifies source → guided lab → acknowledged completion/restart, an injected anonymous-storage failure with retained notes and retry, and 320 px normal/200% text with focus and axe on Chromium and WebKit. Notes must stay out of the stored milestone. Scope feedback queries to the lab so Next.js's separate route-announcement alert remains independent.

`game.smoke.spec.ts` covers the campaign first clear, earned XP, and persisted unlock. `game.regression.spec.ts` exercises all 36 configurations plus lesson return and defensive interaction cases. Use `PLAYWRIGHT_PORT=3127` to isolate the test server from another local checkout. Discovery tests now visit `/learn`; the phone nav uses Play/Learn/Paths/Practice/More.

`game-miniatures.regression.spec.ts` verifies every level’s miniature scene at 320px, captures renderer evidence, and checks stable reduced-motion pixels after clock advancement and resizing.

`japanese-writing.regression.spec.ts` covers browser pen/touch input, all 24 repetitions of a character pair and all three custom sheets, kana word matching, saved-page recovery, rejected-ink bounce/fade, reduced motion, red-margin clearance, phone/iPad/Split View stability, and accessibility checks. Run alongside `japanese-language.regression.spec.ts` with the mobile-Chromium project.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. Regression coverage includes mouse-written shapes with 900ms pauses between strokes, saved Easy/Balanced/Precise selection, automatic checking without a submit button, compact sheet controls with an accessible restart icon, delayed rejection bounce/fade, and stable phone/iPad/Split View layouts. Browser clocks advance validation/cleanup deadlines explicitly. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

Notebook layout regressions exercise real wheel scrolling and two-finger CDP touch gestures at phone, iPad portrait/landscape and Split View widths. They assert that mode buttons are absent, cancelled live strokes leave no ink, saved cells remain intact and the page layout stays stable. Physical iPad Safari/Pencil input remains a device QA gate.

`notebook-catalog.regression.spec.ts` checks actual Japanese previews, optional romaji above the prompts, keyboard toggling, saved notebooks, navigation/reload restoration, stable card heights and phone/iPad/Split View containment. Its `@notebook-catalog` tag runs on all three projects to retain Safari coverage for ruby annotation layout. Run with `npx playwright test --config=apps/web/e2e/playwright.config.ts notebook-catalog.regression.spec.ts`.

## App-wide design audit

`design-foundations.regression.spec.ts` runs public library/catalog/path/reader/diagram/login/basic-practice reflow at 320, 768 and 1440 px, 200% text, axe checks, keyboard disclosures and error recovery navigation. `@design` runs these cases on all three browser platforms. Run `E2E_PORT=3114 npx playwright test --config=apps/web/e2e/playwright.config.ts design-foundations.regression.spec.ts`. Failed evidence must be copied to ignored local audit storage before a rerun replaces the output directory. This is the first subset of the full matrix in `docs/features/app-wide-design-audit.md`; it does not establish full app or installed-native readiness.

The `@design` suites cover public route reflow, keyboard actions and axe at multiple content widths and 200% text. `design-foundations`, `design-content`, `design-japanese` and `design-game` are regression files. Japanese and campaign matrices run normal/enlarged text as independent cases so each keeps the existing test-time budget, axe assertions, geometry checks and captures. Long dictionary visual captures use viewport/section captures while document-wide overflow and accessibility assertions remain active. Follow the app-wide audit for remaining workflows and installed-device evidence.

Foundation keyboard checks verify the skip link stays outside the viewport until focus, appears fully at default/200% text, and moves focus to main when activated. macOS WebKit uses [Safari's documented Option-Tab shortcut for links](https://support.apple.com/guide/safari/cpsh003/mac); other environments use Tab. Keep the focus and viewport assertions in both cases.

`game-map-art.regression.spec.ts` checks fifty-position scenery with twelve playable nodes, all three moving depths, dynamic reduced motion, visual list ordering, keyboard navigation, and centering without inner overflow scrolling or blank seam strips. Run with `PLAYWRIGHT_PORT=3176 npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium game-map-art.regression.spec.ts game.smoke.spec.ts`.

The `@map-art` tag also runs this spec in desktop Chromium and mobile WebKit. Omit `--project` for the three-browser lane.

Map-art checks independently double frontier heading/caption sizes at 200% text and measure the playable heading/row gaps and panel containment at 320 px. Inspect viewport captures as well as stitched element captures; fixed navigation drawn into a tall element screenshot does not establish its viewport behavior.
