# Home Discovery And Section Catalogs

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: Web and native `/learn` routes are cross-section discovery hubs with curated rows, global local-first search, stable section colors, and full catalog destinations.
- Target outcome: Users can identify Codematica's learning sections, search them together, and open each complete catalog.
- Code touchpoints:
  - `content/discovery/home.json`
  - `packages/core/src/discovery.ts`
  - `packages/core/src/content/schema.ts`
  - `apps/web/src/components/HomeDiscovery.tsx`
  - `apps/web/src/components/SectionCatalogs.tsx`
  - `apps/web/src/components/AppHeader.tsx`
  - `packages/ui/src/screens.tsx`
- Primary tests:
  - `packages/core/src/discovery.test.ts`
  - `packages/core/src/content/build-index.test.ts`
  - `apps/web/src/components/HomeDiscovery.test.tsx`
  - `apps/web/e2e/specs/home-discovery.regression.spec.ts`
  - `apps/mobile/src/__tests__/mobile-screens.test.tsx`
  - `apps/mobile/.maestro/learn-discovery.regression.yaml`

## One-Minute Brief

The Learn route provides discovery; the complete learning-path catalog has its own route. Home shows Keep reading when available, local search across sections, and curated rows for Learning paths, Lessons & diagrams, Interview prep, Practice & review, and Languages. Each row has a stable accessible accent and a `View all` link to the full catalog.

## Outcome / Contract

- `/learn` shows discovery on web and native. `/` is the [game campaign](restore-the-signal.md).
- `/paths` shows every published learning path; `/paths/[slug]` remains one ordered path.
- `/browse` shows every published lesson and diagram with track, difficulty, and content-type filters.
- `/interviews` shows company entry points and the complete filterable interview-question catalog.
- `/practice` shows every published exercise and passive flashcard feed.
- `/languages` shows available language hubs; Japanese is the first collection.
- Home search covers paths, documents, diagrams, exercises, passive feeds, interview companies/questions, language characters, vocabulary, and language hubs without Supabase.
- An active home query replaces curated rows with results grouped by section. Clearing it restores the curated home.
- `content/discovery/home.json` owns editorial ordering. Index generation rejects missing, duplicate, or section-incompatible references.
- Generated content index schema version `12` includes `homeDiscovery`.

## Detailed Behavior

### Sections And Themes

- Learning paths: teal `#00645f`.
- Lessons & diagrams: blue `#1d4e9e`.
- Interview prep: purple `#4b369e`.
- Practice & review: rose `#a6263c`.
- Languages: ochre `#7a5200`.
- Section actions use a consistent teal text link on the neutral canvas. Category accents remain in icons and metadata.
- Headings, icons, and labels identify sections alongside color.
- Application controls such as Sign in and Back remain neutral.

### Curation And Search

- Home curation references canonical content rather than duplicating titles, summaries, or routes.
- Curated rows scroll horizontally on all screen sizes, retaining every curated item. Compact cards preview the next item on phones.
- Learn cards show the title, category/type label and available difficulty metadata. Curated rows, search results and Keep reading omit description previews and grow naturally with their titles. Summaries remain in the source index and searchable; shared cards in full catalogs retain their descriptions.
- Native discovery cards announce the title, type/category and displayed difficulty in their accessible name. Resume cards announce the title and type. Compact cards keep description hints absent; full-catalog cards preserve their existing summary hint.
- Search uses a normalized `DiscoveryResult` contract and fuzzy ranking weighted toward title, tags, section labels, and summaries.
- Exact titles receive the highest score. Only published content is searchable.
- Search de-duplicates canonical routes even when content appears in several learning paths.
- Learn offers five section shortcuts: Paths, Lessons, Practice, Interviews and Languages. It omits a shortcut back to the current Learn page. Native shortcuts wrap into rows with a minimum label width that grows with system text size and is capped by the viewport. The short “Search topics” placeholder avoids clipped multiline hints; the input retains its “Search all content” accessible label and links to that visible label with a stable per-instance native ID. Android uses the label association; iOS retains the explicit accessible name.
- Native section titles and View all actions stack when enlarged text leaves less than 350 pt of effective width (`width / fontScale`, with scale above 1.4). Give the title the full available width; do not squeeze it beside the action. Normal phone/tablet headers retain their row layout.
- Native global discovery waits for a 300 ms typing pause before running the shared lookup. While pending, it announces “Searching…” and hides results from the previous query. New input, clear and unmount cancel the pending timer. The input and curated view update immediately; search scope and ranking remain shared with web. Browse reuses the same local search hook and retains its document/diagram search API.

### Full Catalogs

- Paths are grouped by category and filterable by kind and category. Language courses carry an explicit Language path label.
- Practice is grouped into Active practice and Quick review feeds and filterable by type and difficulty.
- The language catalog exposes Japanese counts and links to both the lookup hub and ordered foundations path.
- Interview company tiles remain available while all questions are searchable and filterable below them.
- The lesson library supports a lesson/diagram filter and returns the full result set, removing the former cap of 30.

## Data Model And Failure Handling

- `homeDiscoveryFileSchema` validates the five required curated sections and their item references.
- The index build allows no discovery manifest in isolated test fixtures, but the repository manifest is required by product convention.
- Invalid reference kinds, missing slugs, or duplicate references fail `npm run content:index` and `npm run content:check`.
- Empty searches do not generate a large result list; they show curated rows.
- No-result searches show a local empty state and never require a network fallback.

See [Adaptive Interface And Navigation](adaptive-ui.md) for the persistent phone/tab/sidebar contract and visual rules.

## App-wide design pass — 2026-10-03

Discovery uses the shared page, search field and action styles. Clear search returns focus to the field; each View all action has a contextual accessible name. Carousels remain keyboard-focusable named groups and use proximity snapping. Learn cards wrap titles and labels without description previews or a fixed minimum card height. Full-catalog variants still wrap their descriptions. Keep reading relies on the shared navigation account menu for authentication.

Test plan additions: `HomeDiscovery.test.tsx`, `SaveProgressPrompt.test.tsx`, native `design-controls.test.tsx`, and `design-content.regression.spec.ts` cover clear/focus, destinations and the normal-flow progress notice. The app-wide audit owns final cross-platform evidence.

## Test Plan

- Native live text-size regression: enter a query, enlarge system text and restore it while Learn is open. Keep the query and settled count; titles and labels must reflow without descriptions. `adaptive-text.test.tsx` pins parent/input state and host text refresh; installed APK captures verify geometry.

- Navigation/layout: `adaptive-navigation.smoke.spec.ts`, `adaptive-layout.regression.spec.ts`, and `AppHeader.test.tsx`; native `adaptive-navigation.test.tsx` and Maestro navigation smoke.

- Unit: search covers every section, exact-title ranking, published-only results, route de-duplication, and curated section resolution.
- Integration: index generation serializes schema version 12 and rejects invalid home references.
- Component: web home renders all section destinations and swaps curated rows for grouped search results. Curated/search/resume cards retain titles, labels and routes while omitting summaries; the shared full-catalog card still renders its summary. Copy edits preserve search scope and the no-result message’s meaning.
- Native search labels: `design-controls.test.tsx` verifies all four shared search fields on Android and iOS, including stable associations through typing/clearing and distinct IDs for duplicate mounted screens. Installed TalkBack must announce the visible search scope on an empty input; a shortened placeholder alone is insufficient. Preserve query values, the Search key, and clear-action focus.
- Native card names: verify visible type and human-readable difficulty metadata for curated/search cards, including items without difficulty; verify the resume type and destination. Keep descriptions absent from compact names and hints. Native accessible names override automatic descendant text aggregation, so visible metadata alone is insufficient.
- Native: shared home renders every section and searches interview questions from the bundled index. Curated/search/resume tests pin titles, labels and navigation without descriptions or verbose description hints. Phone/tablet enlarged-text regressions preserve shortcut destinations, wrapping and scaled label space. Section-header regressions cover stacking at 375 pt/2.86 scale and 768 pt/2.5 scale, normal rows at 320/375/834 pt, and the wider enlarged row at 834 pt/2 scale. Preserve every View all destination. These component assertions pin the layout rule; device captures must verify actual text geometry. Fake-timer coverage pins the 299/300 ms lookup boundary, coalesced input, hidden obsolete results and cancellation on clear while calling the real shared search through a spy.
- Installed native: `.maestro/learn-discovery.regression.yaml` checks a fully visible compact curated/search card, titles and labels, absent descriptions, search clearing and the ML path roadmap destination. It captures both card states, including difficulty metadata above the fixed navigation. Run at default and large system text on Android and iOS with a credential-free E2E build. The existing offline-learning flow verifies path → lesson → practice → compact Keep reading → resume, including absent resume descriptions and a captured resume panel. Its resume locator includes the displayed type (`Resume Cache Product Contract, Practice`), matching the native accessible name. Large text uses bounded catalog waypoints and centers the actual curated/search card with a slow target-based scroll. Avoid fixed follow-up swipes: an already visible large card can move offscreen. Every locator keeps its 20-second limit, full-card visibility and original title/metadata/absence/navigation assertions. The settled-result check retains the exact count while accepting native display casing (`7 results` or `7 RESULTS` after the event-log catalog integration). After clearing, use the field’s Search key to dismiss input; a floating Android IME may not consume a generic Back dismissal, which would leave Learn. Preserve the clear, curated-card and destination assertions.
- Screen readers: on the current installed artifact, traverse the Learn heading and search field, enter a query with the software keyboard, submit it, navigate results, and open/dismiss More with focus returning to its trigger. Check TalkBack and VoiceOver separately. Follow the [native E2E guide](../../apps/mobile/e2e/README.md#native-screen-reader-checks) for device isolation and evidence; announcement text and interaction captures do not establish audible speech quality or complete platform acceptance.
- E2E: phone Chromium, desktop Chromium and iPhone WebKit verify compact curated/search cards, Japanese/interview/language search, accessible section actions, and navigation to a full catalog. Inspect the local preview at phone, tablet and desktop widths for overflow and natural card height.

## Decision Log

- `2026-10-04`: Keep Learn concise with titles and metadata; descriptions remain searchable and available in full catalogs.
- `2026-10-04`: Coalesce native global discovery lookup after a short typing pause. Installed large-text checks exposed delayed intermediate-query results; preserve the full shared search rather than changing its ranking or searchable fields.
- `2026-07-22`: Replace the path-first root with a cross-section discovery hub.
- `2026-07-22`: Move the complete path catalog to `/paths` and add `/practice` and `/languages` catalog routes.
- `2026-07-22`: Keep curation in canonical JSON while keeping colors and layout in design tokens.
- `2026-07-22`: Add a separate discovery search API so `/browse` can preserve its document/diagram-specific search contract.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/home-discovery.md first. Compare content/discovery/home.json, packages/core/src/discovery.ts, apps/web/src/components/HomeDiscovery.tsx, apps/web/src/components/SectionCatalogs.tsx, packages/ui/src/screens.tsx, and the home discovery tests, then update curation, routes, tests, and docs together.`

## Campaign navigation update (2026-09-29)

Discovery, search, and Keep reading retain their behavior at `/learn`. `content/discovery/home.json` remains their editorial source. Play is the root campaign, and learning content remains accessible regardless of campaign progress. Existing discovery browser/device flows now enter through Learn.

### Native local search execution

Native Learn and Browse run their expensive fuzzy matching in an isolated, offline WebView using the same pure core functions. `search:runtime` produces the fixed adapter script; `search:check` enforces its freshness in CI. The host prepares rows once, sends JSON after a 300 ms typing pause, and derives result metadata and routes from its own canonical rows. The runtime returns request IDs and row positions; superseded, cleared, duplicate or unmounted replies cannot replace the current result.

The runtime is hidden from layout, touch and accessibility traversal. CSP blocks network access and native navigation allows only `about:blank`. Authored strings are JSON data and never enter its HTML. Waiting for readiness and executing a match each have a 15-second deadline; renderer, transport or result failures expose a concise message and Retry search. Retry remounts the local runtime and retains the query. The shared UI can still use synchronous core search when no runtime adapter is supplied; the installed Expo adapter always supplies the generated script. Supabase remains optional.

Tests cover prepared-row parity, row validation and canonical destination ownership; the generated bundle's startup and queries in a VM; and native readiness, typing, replacement, clearing, changed indexes/filters, deadlines, retry, renderer failures and unmount. Both owning screens have composition/navigation coverage. Installed regression assertions retain the exact six-result count and existing 20-second deadline. Android/iOS startup and timing require current installed-artifact evidence; older Hermes-only results do not prove this execution path.
