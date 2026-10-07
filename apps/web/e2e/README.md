# Web End-To-End Tests

Playwright runs the complete suite in mobile Chromium. Critical `@smoke` journeys, `@playground` and `@notebook-catalog` regressions also run in desktop Chromium and mobile WebKit. Deeper cases use `@regression`.

The runner builds and serves the production Next app, avoiding dev-server compilation and Fast Refresh during parallel tests. CI uses two workers to limit concurrent canvas/browser load on hosted runners; local runs use four. All browser projects and assertions remain enabled.

```bash
npm run e2e:web:smoke
npm run e2e:web:regression
npm run e2e:web:release
```

Specs live in `specs/` and use `*.smoke.spec.ts` or `*.regression.spec.ts`. Use role queries or stable `data-testid` values; do not use CSS selectors or fixed waits. Failures retain traces, screenshots, and video in `test-results/artifacts/`. JUnit output goes to `test-results/junit.xml`; the HTML report goes to `playwright-report/`.

The durable matrix, CI schedules, and release contract live in `docs/features/automated-testing-and-release-regression.md`.

`code-contrast.regression.spec.ts` verifies the actual CSS cascade for lessons at phone/desktop widths, all algorithm languages, Python companions, review snippets, SQL/plain code, Mermaid source, and edited playground syntax. It measures code text against the dark surface (including the faint grid lines), protects inline-code styling, and blocks hosted execution for editor-only checks. Run with `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium apps/web/e2e/specs/code-contrast.regression.spec.ts`.

`playground.regression.spec.ts` verifies automatic startup, one runtime shared with the console, preview identity retained during connected Run, edited code execution, actual Reset output, and recovery with edits after a blocked hosted-runtime connection. Run it with `npx playwright test --config=apps/web/e2e/playwright.config.ts apps/web/e2e/specs/playground.regression.spec.ts`. It advances the browser clock for the connection deadline; it does not sleep or inject fake application state. Generated reports under `apps/web/e2e/` are excluded from lint, not deleted.

Editor tests share `code-editor.ts`: choose CodeMirror's shortcut from the emulated browser platform, focus the editable textbox, replace the whole document, then assert its exact text before Run. An emulated iPhone uses Meta even on Linux. `scripts/testing/code-editor.test.ts` covers desktop, iOS, Android and touch-boundary cases. Each of the eight primary-route accessibility audits has its own default test budget and fresh page.

The Japanese hub Axe audit and its keyboard/font-resize/reduced-motion journey also use separate fresh pages and the default thirty-second deadline. Keep the serious/critical audit, 320px viewport, 200% font, exact skip-link focus, overflow and motion assertions; do not combine their budgets or increase the timeout to mask cumulative work.

`systems-boundaries.regression.spec.ts` reads all six Systems Boundary Review lessons and sources, completes shuffled checkpoints, verifies wrong-answer feedback and 80% scoring, and follows each next lesson or terminal state. Match independently specified answer labels for whichever question is shown; question order is intentionally shuffled.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. The adaptive UI reuses existing screens and feature logic. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Editorial regression lane

`npm run e2e:linkedin` sets `EDITORIAL_E2E=1` and runs the admin review/refinement/approval and denied-access journey with a fake Supabase URL/key and intercepted RPCs. It makes no hosted database writes. This spec is skipped outside the dedicated lane. Default public smoke/release lanes explicitly clear public Supabase config so local credentials cannot change signed-out expectations. Run both `npm run e2e:smoke` and `npm run e2e:linkedin`.

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Restore the Signal

`game.smoke.spec.ts` covers the campaign first clear, earned XP, and persisted unlock. `game.regression.spec.ts` exercises all 36 configurations plus lesson return and defensive interaction cases. Use `PLAYWRIGHT_PORT=3127` to isolate the test server from another local checkout. Discovery tests now visit `/learn`; the phone nav uses Play/Learn/Paths/Practice/More.

`game-miniatures.regression.spec.ts` verifies every level’s miniature scene at 320px, captures renderer evidence, and checks stable reduced-motion pixels after clock advancement and resizing.

`japanese-writing.regression.spec.ts` covers browser pen/touch input, all 24 repetitions of a character pair and all three custom sheets, kana word matching, saved-page recovery, rejected-ink bounce/fade, reduced motion, red-margin clearance, phone/iPad/Split View stability, and accessibility checks. Run alongside `japanese-language.regression.spec.ts` with the mobile-Chromium project.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. Regression coverage includes mouse-written shapes with 900ms pauses between strokes, saved Easy/Balanced/Precise selection, automatic checking without a submit button, compact sheet controls with an accessible restart icon, delayed rejection bounce/fade, and stable phone/iPad/Split View layouts. Browser clocks advance validation/cleanup deadlines explicitly. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

Notebook layout regressions exercise real wheel scrolling and two-finger CDP touch gestures at phone, iPad portrait/landscape and Split View widths. They assert that mode buttons are absent, cancelled live strokes leave no ink, saved cells remain intact and the page layout stays stable. Physical iPad Safari/Pencil input remains a device QA gate.

`notebook-catalog.regression.spec.ts` checks actual Japanese previews, optional romaji above the prompts, keyboard toggling, saved notebooks, navigation/reload restoration, stable card heights and phone/iPad/Split View containment. Its `@notebook-catalog` tag runs on all three projects to retain Safari coverage for ruby annotation layout. Run with `npx playwright test --config=apps/web/e2e/playwright.config.ts notebook-catalog.regression.spec.ts`.

`npm run e2e:interview-admin` exercises synthetic private tracker RPCs: failed create recovery, edited-package import, reading, study routing and Markdown download. No hosted data is used.

`game-map-art.regression.spec.ts` checks fifty-position scenery with twelve playable nodes, all three moving depths, dynamic reduced motion, visual list ordering, keyboard navigation, and centering without inner overflow scrolling or blank seam strips. Run with `PLAYWRIGHT_PORT=3176 npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium game-map-art.regression.spec.ts game.smoke.spec.ts`.

The `@map-art` tag also runs this spec in desktop Chromium and mobile WebKit. Omit `--project` for the three-browser lane.

`event-log.regression.spec.ts` (`@regression @playground`) covers the attempt-review lesson, all three runnable TS projects, Python switching, cursor continuation across node movement, quiz feedback and scrolling review on all three browser projects.

The merged release matrix retains `@smoke`, `@playground`, `@notebook-catalog`, `@interview-admin` and `@map-art` on desktop Chromium and mobile WebKit. Mobile Chromium runs the complete suite. `scripts/testing/browser-matrix.test.ts` imports the actual configuration and checks every retained tag independently so a future conflict resolution cannot silently drop a lane.
