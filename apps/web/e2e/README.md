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

## Restore the Signal

`game.smoke.spec.ts` covers the campaign first clear, earned XP, and persisted unlock. `game.regression.spec.ts` exercises all 36 configurations plus lesson return and defensive interaction cases. Use `PLAYWRIGHT_PORT=3127` to isolate the test server from another local checkout. Discovery tests now visit `/learn`; the phone nav uses Play/Learn/Paths/Practice/More.

`game-miniatures.regression.spec.ts` verifies every level’s miniature scene at 320px, captures renderer evidence, and checks stable reduced-motion pixels after clock advancement and resizing.
