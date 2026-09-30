# Home Discovery And Section Catalogs

## Snapshot

- Status: `shipped`
- Last updated: `2026-09-05`
- Owner thread: `n/a`
- Current state: Web and native home routes are cross-section discovery hubs with curated rows, global local-first search, stable section colors, and full catalog destinations.
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

## One-Minute Brief

The root route provides discovery; the complete learning-path catalog has its own route. Home shows Keep reading when available, local search across sections, and curated rows for Learning paths, Lessons & diagrams, Interview prep, Practice & review, and Languages. Each row has a stable accessible accent and a `View all` link to the full catalog.

## Outcome / Contract

- `/` shows the discovery home on web and native.
- `/paths` shows every published learning path; `/paths/[slug]` remains one ordered path.
- `/browse` shows every published lesson and diagram with track, difficulty, and content-type filters.
- `/interviews` shows company entry points and the complete filterable interview-question catalog.
- `/practice` shows every published exercise and passive flashcard feed.
- `/languages` shows available language hubs; Japanese is the first collection.
- Home search covers paths, documents, diagrams, exercises, passive feeds, interview companies/questions, language characters, vocabulary, and language hubs without Supabase.
- An active home query replaces curated rows with results grouped by section. Clearing it restores the curated home.
- `content/discovery/home.json` owns editorial ordering. Index generation rejects missing, duplicate, or section-incompatible references.
- Generated content index schema version `7` includes `homeDiscovery`. [Unclear: the Test Plan below names schema version 9.]

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
- Search uses a normalized `DiscoveryResult` contract and fuzzy ranking weighted toward title, tags, section labels, and summaries.
- Exact titles receive the highest score. Only published content is searchable.
- Search de-duplicates canonical routes even when content appears in several learning paths.

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

## Test Plan

- Navigation/layout: `adaptive-navigation.smoke.spec.ts`, `adaptive-layout.regression.spec.ts`, and `AppHeader.test.tsx`; native `adaptive-navigation.test.tsx` and Maestro navigation smoke.

- Unit: search covers every section, exact-title ranking, published-only results, route de-duplication, and curated section resolution.
- Integration: index generation serializes schema version 9 and rejects invalid home references.
- Component: web home renders all section destinations and swaps curated rows for grouped search results. Copy edits preserve search scope and the no-result message's meaning.
- Native: shared home renders every section and searches interview questions from the bundled index.
- E2E: mobile-sized web home exposes Japanese, searches interviews and language content, preserves consistent accessible section actions, and navigates to a full catalog.

## Decision Log

- `2026-07-22`: Replace the path-first root with a cross-section discovery hub.
- `2026-07-22`: Move the complete path catalog to `/paths` and add `/practice` and `/languages` catalog routes.
- `2026-07-22`: Keep curation in canonical JSON while keeping colors and layout in design tokens.
- `2026-07-22`: Add a separate discovery search API so `/browse` can preserve its document/diagram-specific search contract.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/home-discovery.md first. Compare content/discovery/home.json, packages/core/src/discovery.ts, apps/web/src/components/HomeDiscovery.tsx, apps/web/src/components/SectionCatalogs.tsx, packages/ui/src/screens.tsx, and the home discovery tests, then update curation, routes, tests, and docs together.`
