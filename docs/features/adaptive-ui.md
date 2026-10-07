# Adaptive Interface And Navigation

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: Shared visual styles and persistent web/native navigation are implemented. Current installed Android account/editorial journeys pass at normal and enlarged text. Installed iOS, complete keyboard geometry and native screen-reader acceptance remain open.
- Target outcome: A quieter, consistent interface with clearly named destinations and comfortable phone, tablet, and desktop layouts.
- Code touchpoints: `apps/web/src/components/AppHeader.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `packages/ui/src/screens.tsx`, `packages/ui/src/tokens.ts`, `apps/mobile/app/_layout.tsx`.
- Primary tests: `AppHeader.test.tsx`, `adaptive-navigation.test.tsx`, `adaptive-navigation.smoke.spec.ts`, `adaptive-layout.regression.spec.ts`, `.maestro/adaptive-navigation.yaml`.

## One-Minute Brief

The redesign reduces heavy borders and repeated headings and makes sections easier to find. It reuses catalog, card, dropdown, practice, reader, and native screen components. Content, search, grading, progress, authentication, external links, and routes keep their existing behavior.

## Outcome / Contract

- Web below 768 px uses persistent Play, Learn, Paths, Practice, and More bottom controls. More contains Interviews, Lessons, Languages, the optional Admin group, and Sign in or the current account.
- Web at 768 px and above shows all seven destinations in a left sidebar, with a separate optional Admin group and Sign in or the current account in its footer.
- Native uses the same destinations. A sidebar appears when width is at least 768 pt and width divided by font scale is at least 600; Split View and large text can return to compact navigation.
- Section selection includes nested routes; standalone documents and diagrams select Lessons.
- The existing URL and native route structures remain intact. Native top-level switches use Expo Router `navigate`; existing in-content navigation remains unchanged.
- Web navigation is mounted once in the root layout, including readers and error pages. `AppHeader` remains a contextual label for existing callers.
- Learn exposes all five catalog shortcuts before the curated rows. Search and all curated entries remain available.
- Native safe-area layout reserves space around the stack and navigation. Web bottom navigation and its menu account for the home indicator. Page content reserves bottom clearance.

## Current State

Shared navigation, concise catalog headings, lighter typography and borders, consistent corners, focus states, and compact discovery cards are implemented. Native source coverage passes. The earlier September startup/patch blockers are historical: the current dependency alignment passes all 20 Expo Doctor checks. Current Android public workflows and the separate disposable local account/editorial journey have passing normal/enlarged-text evidence, recorded in the [app-wide audit](app-wide-design-audit.md). Inspected captures retain their viewport limits. Installed iOS, complete keyboard/safe-area coverage and VoiceOver/TalkBack acceptance remain separate gates; browser emulation and Jest do not establish native release readiness.

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

- [Design system](design-system.md) is the reusable web control and spacing contract. The LinkedIn editor adopts shared named buttons and compact disclosures first; the app-wide route/platform audit tracks the remaining adoption work. Editorial web actions show text on narrow or touch-capable screens and use 48 px targets; native shared actions keep text with 48 dp targets. Editorial pane selection uses available content width so iPad portrait/Split View does not squeeze the editor beside the sidebar.
- Signed-in admins see a separate Admin group with LinkedIn, Knowledge and Interview preparation links with active destinations (Knowledge is web-only). The sidebar footer shows account name/email with an expandable Sign out action; phone header and More reuse the disclosure. Escape restores focus. Short-screen navigation scrolls while the footer stays reachable. Profile/settings can extend the same menu later. See [Auth and progress](auth-and-progress.md) for session and sign-out behavior.

- App branding uses the approved Patch head and wordmark in existing web/native headers and sidebars. Native home links reserve a 48 dp minimum target; their artwork keeps its existing dimensions. See `brand-identity.md` for source ownership, browser icons and native packaging.

- Use concrete copy that names the item or action. Shared study controls say “Next activity,” “Practice complete,” and “Quick review.” Preserve instructions, prerequisites, error meaning, and technical values when shortening text.
- Neutral canvas, white surfaces, teal primary navigation, and restrained category colors.
- Semibold titles, regular body copy, thin borders, and consistent 12–16 px corners replace raised heavy controls.
- Home section actions use the same teal text treatment. Category colors remain in icons and metadata.
- Curated rows scroll horizontally with a visible scrollbar on desktop and a next-card preview on phones. They do not truncate the curated content set.
- Path catalog cards use full-width rows on desktop and stacked actions on phones; category filtering remains unchanged.
- Web More uses the native HTML dialog focus trap, Escape dismissal, and trigger focus restoration. Native More uses a modal with close/back dismissal.
- Draft selection/restoration, opt-in native keyboard-aware scrolling, text enlargement, tooltip Escape dismissal and touch geometry follow the design system. Installed native VoiceOver/TalkBack and software-keyboard verification remain separate from browser emulation.
- Global web focus outlines, pointer affordances, press feedback, and reduced-motion handling apply consistently. Save-progress prompts follow page content in normal flow, with shell clearance from bottom navigation. Their first appearance cannot move an active handwriting canvas.

### Data Model And Persistence

Adaptive layout preserves content schemas, generated data, persisted progress, and API contracts.

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

- Copy edits update text-based assertions in web component, native screen, and Playwright tests. Keep route, action, disabled-state, progress, and recovery assertions intact; run the affected suites and responsive browser checks.
- Regression-first component tests fail before navigation implementation, then prove destination preservation, nested active states, menu links, and close behavior.
- Vitest: `npx vitest run apps/web/src/components/AppHeader.test.tsx apps/web/src/components/HomeDiscovery.test.tsx`.
- Jest: `npm run test:mobile -- adaptive-navigation.test.tsx`; phone menu destinations, single-line phone labels, and naturally wrapping tablet labels, including the admin destination. System font scaling stays enabled in both layouts. Clamping tablet labels to one line must fail the regression.
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

- Installed iPhone/iPad verification requires supported Xcode. Current Android evidence is recorded in the app-wide audit; complete physical accessibility and human visual acceptance remain open.

## Decision Log

- `2026-09-05`: Keep the existing route and component architecture. Use platform primitives for a five-control compact bar and full sidebar; avoid a new navigation/UI dependency.

## Documentation Updates

Updated home discovery, native deployment, the docs hub, package/mobile/E2E READMEs, component inventory, engineering overview, cross-task context, and changelog.

## Thread Handoff Prompt

`Read docs/features/adaptive-ui.md and docs/codex-context.md. Preserve all feature behavior while checking responsive presentation. Run the navigation and layout regressions, and distinguish browser/Jest success from installed native device verification.`

## Game surfaces

The campaign at `/` and `/play/*` uses the original cream/teal painted-world treatment described in [Restore the Signal](restore-the-signal.md). Editors and controls stay in normal UI with keyboard/tap alternatives. `/learn` retains the quiet discovery layout. Mobile and desktop expose the same destinations; `/play/*` marks Play active. Reduced motion removes decorative parallax and movement.

### Native tab text at accessibility sizes — 2026-09-29

Phone tab labels fit on a single line, scaling down only when needed to fit the available tab width. System font scaling stays enabled; the full destination label remains the tab accessibility label. This prevents the long Interviews label from breaking mid-word at larger iOS text sizes. The iPad rail keeps natural text wrapping. `adaptive-navigation.test.tsx` guards these text props, and simulator visual QA covers enlarged system text.

## Japanese notebook update — 2026-10-02

Languages exposes Japanese and Notebook practice in the tablet/sidebar and phone More menus. `/languages/japanese/notebooks` supports curated and custom 1–5-character prompts and saved pages. [Japanese writing notebooks](japanese-writing-notebooks.md) owns the shared 24-repetition engine, device-local ink, maximum-progress synchronization and validation gates. Live ink and feedback preserve page position; Input is detected automatically. Mouse wheel/trackpad scrolling remains available on web; two-finger gestures scroll the paper on touch screens and installed apps without adding ink. There are no Draw, Pen or Scroll buttons.

Native notebook pages reserve visible paper on entry with a compact back/title row and inline example summary. The error/instruction area stays above the paper and does not move during grading. Controls keep 48 dp targets and scalable text. Handwriting routes disable native swipe-back because iPad can interpret a rightward stroke as navigation; persistent navigation and the labeled notebook back action remain available. `apps/mobile/e2e/notebook-layout.mjs` measures usable paper space beside navigation, while the gesture runner checks real input and retained page bounds.

## Full app audit — 2026-10-03

[App-wide design audit](app-wide-design-audit.md) owns the complete reachable route/platform matrix. Native navigation now mirrors the account/footer and separate Admin grouping on web; its scrolling tablet navigation keeps the account reachable. Login and basic practice use keyboard-aware AppScreen. Shared native Button is extracted for reuse with visible scalable labels and 48 dp actions. Web catalogs/readers/basic practice adopt Button/ButtonLink, wrapping filters, readable prose width and concise disclosures. Source/Jest/browser evidence is recorded separately from installed Android/iOS verification; completion of this subset does not complete the app-wide audit.
