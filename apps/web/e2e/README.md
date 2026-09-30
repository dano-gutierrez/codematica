# Web End-To-End Tests

Playwright runs the complete suite in mobile Chromium. Critical `@smoke` journeys also run in desktop Chromium and mobile WebKit. Deeper cases use `@regression`.

The runner builds and serves the production Next app so parallel browser workers do not depend on dev-server compilation or Fast Refresh.

```bash
npm run e2e:web:smoke
npm run e2e:web:regression
npm run e2e:web:release
```

Specs live in `specs/` and use `*.smoke.spec.ts` or `*.regression.spec.ts`. Use role queries or stable `data-testid` values; do not use CSS selectors or fixed waits. Trace, screenshot, and video are retained on failure in `test-results/artifacts/`; JUnit is written to `test-results/junit.xml`, and the HTML report is written to `playwright-report/`.

The durable matrix, CI schedules, and release contract live in `docs/features/automated-testing-and-release-regression.md`.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. Existing screens and feature logic are reused. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.

## Editorial regression lane

`npm run e2e:linkedin` sets `EDITORIAL_E2E=1` and runs the admin review/refinement/approval and denied-access journey with a fake Supabase URL/key and intercepted RPCs. It makes no hosted database writes. This spec is skipped outside the dedicated lane. Default public smoke/release lanes explicitly clear public Supabase config so local credentials cannot change signed-out expectations. Run both `npm run e2e:smoke` and `npm run e2e:linkedin`.
