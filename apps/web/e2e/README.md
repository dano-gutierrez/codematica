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
