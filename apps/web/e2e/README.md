# Web End-To-End Tests

Playwright runs the complete suite in mobile Chromium. Critical `@smoke` journeys and `@playground` regressions also run in desktop Chromium and mobile WebKit. Deeper cases use `@regression`.

The runner builds and serves the production Next app, avoiding dev-server compilation and Fast Refresh during parallel tests.

```bash
npm run e2e:web:smoke
npm run e2e:web:regression
npm run e2e:web:release
```

Specs live in `specs/` and use `*.smoke.spec.ts` or `*.regression.spec.ts`. Use role queries or stable `data-testid` values; do not use CSS selectors or fixed waits. Failures retain traces, screenshots, and video in `test-results/artifacts/`. JUnit output goes to `test-results/junit.xml`; the HTML report goes to `playwright-report/`.

The durable matrix, CI schedules, and release contract live in `docs/features/automated-testing-and-release-regression.md`.

`code-contrast.regression.spec.ts` verifies the actual CSS cascade for lessons at phone/desktop widths, all algorithm languages, Python companions, review snippets, SQL/plain code, Mermaid source, and edited playground syntax. It measures code text against the dark surface (including the faint grid lines), protects inline-code styling, and blocks hosted execution for editor-only checks. Run with `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium apps/web/e2e/specs/code-contrast.regression.spec.ts`.

`playground.regression.spec.ts` verifies automatic startup, one runtime shared with the console, edited code execution, actual Reset output, and recovery with edits after a blocked hosted-runtime connection. Run it with `npx playwright test --config=apps/web/e2e/playwright.config.ts apps/web/e2e/specs/playground.regression.spec.ts`. It advances the browser clock for the connection deadline; it does not sleep or inject fake application state. Generated reports under `apps/web/e2e/` are excluded from lint, not deleted.

## Adaptive UI

See `docs/features/adaptive-ui.md` for persistent phone navigation, desktop/iPad sidebars, design rules, and validation gaps. The adaptive UI reuses existing screens and feature logic. Navigation coverage lives in `AppHeader.test.tsx`, native `adaptive-navigation.test.tsx`, Playwright `adaptive-navigation.smoke.spec.ts` / `adaptive-layout.regression.spec.ts`, and Maestro `adaptive-navigation.yaml`.
