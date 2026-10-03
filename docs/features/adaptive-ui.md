# Adaptive Interface And Navigation

## Snapshot

- Status: `in_progress`
- Last updated: `2026-09-05`
- Owner thread: `n/a`
- Current state: Implemented a shared visual refresh and persistent web/native navigation; installed native verification remains pending local toolchain repair.
- Target outcome: A quieter, consistent interface with clearly named destinations and comfortable phone, tablet, and desktop layouts.
- Code touchpoints: `apps/web/src/components/AppHeader.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `packages/ui/src/screens.tsx`, `packages/ui/src/tokens.ts`, `apps/mobile/app/_layout.tsx`.
- Primary tests: `AppHeader.test.tsx`, `adaptive-navigation.test.tsx`, `adaptive-navigation.smoke.spec.ts`, `adaptive-layout.regression.spec.ts`, `.maestro/adaptive-navigation.yaml`.

## One-Minute Brief

The redesign addresses competing heavy borders, repeated explanatory headings, and hard-to-find sections. It reuses existing catalog, card, dropdown, practice, reader, and native screen components. Content, search, grading, progress, authentication, external links, and route contracts stay unchanged.

## Outcome / Contract

- Web below 768 px uses persistent Play, Learn, Paths, Practice, and More bottom controls. More contains Interviews, Lessons, Languages, and Sign in.
- Web at 768 px and above shows all six destinations plus Sign in in a left sidebar.
- Native uses the same destinations. A sidebar appears when width is at least 768 pt and width divided by font scale is at least 600; Split View and large text can return to compact navigation.
- Section selection includes nested routes; standalone documents and diagrams select Lessons.
- The existing URL and native route structures remain intact. Native top-level switches use Expo Router `navigate`; existing in-content navigation remains unchanged.
- Web navigation is mounted once in the root layout, including readers and error pages. `AppHeader` remains a contextual label for existing callers.
- Learn exposes all five catalog shortcuts before the curated rows. Search and all curated entries remain available.
- Native safe-area layout reserves space around the stack and navigation. Web bottom navigation and its menu account for the home indicator. Page content reserves bottom clearance.

## Current State

Shared navigation, concise catalog headings, lighter typography and borders, consistent corners, focus states, and compact discovery cards are implemented. Native source coverage passes. Native execution is not yet verified: the installed Expo toolchain fails startup while requiring `expo-router/_ctx-shared`; Expo Doctor reports nine patch-version mismatches. Xcode remains 26.3, matching the previously documented native compilation blocker. Dependency upgrades are outside this presentation-only change.

## Scope

### In Scope

- Visual hierarchy, spacing, responsive layout, navigation placement, accessibility, and presentation copy.
- Existing components and platform primitives; no new production dependencies.

### Out Of Scope

- Content edits, persistence, authentication behavior, learning logic, new product capabilities, backend work, and deployment.

### Assumptions

- Light appearance remains the supported theme. Font scaling and reduced-motion preferences remain respected.

## Detailed Behavior

### UI / UX

- Neutral canvas, white surfaces, teal primary navigation, and restrained category colors.
- Semibold titles, regular body copy, thin borders, and consistent 12–16 px corners replace raised heavy controls.
- Home section actions use the same teal text treatment. Category colors remain in icons and metadata.
- Curated rows scroll horizontally with a visible scrollbar on desktop and a next-card preview on phones. They do not truncate the curated content set.
- Path catalog cards use full-width rows on desktop and stacked actions on phones; category filtering remains unchanged.
- Web More uses the native HTML dialog focus trap, Escape dismissal, and trigger focus restoration. Native More uses a modal with close/back dismissal.
- Global web focus outlines, pointer affordances, press feedback, and reduced-motion handling apply consistently. Save-progress prompts stay at the top edge, away from bottom navigation and questionnaire continuation controls.

### Data Model And Persistence

No changes to content schemas, generated data, persisted progress, or API contracts.

### Business Logic

Only navigation presentation and active-destination matching are added. Existing feature event handlers remain in place.

### Failure And Edge Handling

Keep no-result, optional-auth, renderer fallback, and recovery UI. Small screens must not overflow horizontally; intentionally scrollable cards, code, and diagrams keep their own scroll containers.

## Code Touchpoints

- `apps/web/src/components/AppHeader.tsx`: reused header surface plus root `AppNavigation`.
- `apps/web/src/components/HomeDiscovery.tsx`: short introduction, catalog shortcuts, and compact reusable discovery cards.
- `apps/web/src/components/SectionCatalogs.tsx`: concise catalog headings and responsive path rows.
- `apps/web/src/components/Dropdown.tsx`: existing Radix interaction with refreshed presentation.
- `apps/web/src/app/globals.css`: shell, focus/press states, reader typography, and responsive layout.
- `packages/ui/src/screens.tsx`: `NativeNavigation` and existing native screen styles.
- `apps/mobile/app/_layout.tsx`: safe-area-aware adaptive navigation around the existing Stack.

## Test Plan

- Regression-first component tests fail before navigation implementation, then prove destination preservation, nested active states, menu links, and close behavior.
- Vitest: `npx vitest run apps/web/src/components/AppHeader.test.tsx apps/web/src/components/HomeDiscovery.test.tsx`.
- Jest: `npm run test:mobile -- adaptive-navigation.test.tsx`; phone menu destinations and tablet sidebar state.
- Browser smoke: `adaptive-navigation.smoke.spec.ts` runs on mobile Chromium, desktop Chromium, and iPhone WebKit, including Escape/focus restoration.
- Browser regression: run the full `npm run e2e:web:release` lane for every study flow, including questionnaire continuation with a visible save prompt and Japanese 200% text sizing. `adaptive-layout.regression.spec.ts` checks eight catalogs at 320, 390, 768, 1024, and 1440 px; home discovery and top-level accessibility regressions remain required.
- Installed native smoke: `.maestro/adaptive-navigation.yaml`, including phone More and tablet direct links. Run on Android and iOS before native release readiness is claimed.
- Aggregate gates: `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run typecheck`, `npm run lint`, `npm run mobile:doctor`, `npm run build`, and `npm run e2e:smoke`.
- Coverage thresholds and exclusions are unchanged. Database/content logic is untouched; no database migration lane is introduced.

### Local Validation — 2026-09-05

- Web/core coverage: 294 tests pass; all aggregate and per-file thresholds pass.
- Native coverage: 45 tests across eight suites pass; adaptive layout cases include phone, tablet, Split View, and increased font scale.
- Production build, lint, and all workspace TypeScript checks pass.
- The release browser lane passes 32 tests across mobile Chromium, desktop Chromium, and iPhone WebKit. Layout checks cover 320–1440 px. A regression also verifies that home card summaries remain limited to two lines.
- Native installed-app/Maestro and visual checks remain unverified because of the Expo startup and Xcode blockers described above. These results do not establish native release readiness.

## Open Questions

- Installed iPhone/iPad and Android visual verification awaits repair of the pre-existing Expo/Xcode environment.

## Decision Log

- `2026-09-05`: Keep the existing route and component architecture. Use platform primitives for a five-control compact bar and full sidebar; avoid a new navigation/UI dependency.

## Documentation Updates

Updated home discovery, native deployment, the docs hub, package/mobile/E2E READMEs, component inventory, engineering overview, cross-task context, and changelog.

## Thread Handoff Prompt

`Read docs/features/adaptive-ui.md and docs/codex-context.md. Preserve all feature behavior while checking responsive presentation. Run the navigation and layout regressions, and distinguish browser/Jest success from installed native device verification.`

## Game surfaces

The campaign at `/` and `/play/*` uses the original cream/teal painted-world treatment described in [Restore the Signal](restore-the-signal.md). Editors and controls stay in normal UI with keyboard/tap alternatives. `/learn` retains the quiet discovery layout. Mobile and desktop expose the same destinations; `/play/*` marks Play active. Reduced motion removes decorative parallax and movement.
