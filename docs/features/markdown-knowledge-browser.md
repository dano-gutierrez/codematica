# Markdown Knowledge Browser

## Snapshot

- Status: `shipped`
- Last updated: `2026-09-30`
- Owner thread: `n/a`
- Current state: The content library lives at `/browse` and reads a generated local index from repo-authored Markdown, Mermaid, path, exercise, passive flashcard feed, and interview files.
- Target outcome: Users can browse, search, read articles, and render diagrams on mobile without Supabase credentials.
- Code touchpoints:
  - `packages/core/src/content/`
  - `packages/core/src/search.ts`
  - `apps/web/src/components/Dropdown.tsx`
  - `apps/web/src/components/KnowledgeBrowser.tsx`
  - `apps/web/src/components/PathScopedNextLink.tsx`
  - `apps/web/src/app/docs/[...slug]/page.tsx`
  - `apps/web/src/app/diagrams/[...slug]/page.tsx`
- Primary tests:
  - `apps/web/src/components/Dropdown.test.tsx`
  - `packages/core/src/content/parse-markdown.test.ts`
  - `packages/core/src/search.test.ts`
  - `apps/web/e2e/specs/knowledge-browser.smoke.spec.ts`

## One-Minute Brief

The V1 app is a searchable study browser. Content authors create plain Markdown files with validated frontmatter and optional Mermaid blocks. A script generates a local index in `packages/core`, used by both the Next.js web app and Expo native app for browsing, filters, fuzzy search, article routes, and diagram routes.

## Outcome / Contract

- The app must work locally without Supabase.
- Web and native must read the same generated index through `@codematica/core`.
- Markdown frontmatter must be validated before the index is generated.
- Search must be fuzzy by default with no exact/fuzzy toggle in the UI.
- Fuzzy search must weight title, tags, and headings above body text.
- Track, difficulty, and document/diagram filters use the reusable Radix-backed `Dropdown` component, not native select styling.
- The library returns the full filtered local result set rather than truncating at 30 items.
- Embedded Mermaid blocks and external diagram files must render with source/error states.
- Fenced code blocks render with the shared language-aware code theme instead of unstyled browser defaults.
- Highlighted blocks retain their dark background inside Markdown. General prose `pre` styling excludes `.code-block-pre`; inline code keeps its separate light style. Syntax tokens, comments, and unhighlighted text must meet 4.5:1 contrast against the rendered code surface.
- All block code uses the dark `#101820` surface: Markdown (fenced, indented, and unknown languages), interview solutions, Python companions, passive-review snippets, diagram source, playground editors, and authored source after an editor failure. Web prose fallbacks use the same background/foreground variables. Native fenced and indented Markdown reuse the same `CodeBlock`, including blocks nested in lists/quotes. Native code scrolls horizontally inside the available content width; language labels, prose, and page navigation stay fixed. Source height is uncapped so vertical page scrolling reaches every line. Indentation, blank lines, and system font scaling are preserved.
- Theme selection is deferred. This change adds no preference UI or persistence; rendered diagrams and runnable preview output retain their own presentation.
- `packages/core/src/generated/content-index.json` must not be edited manually.

## Current State

The feature is implemented with a growing local content set. The Mermaid authoring path exercises embedded rendering across 11 diagram families while retaining source and error states. Supabase has an optional schema and sync script but is not used by the browser runtime.

### Code-surface audit — 2026-09-28

| Surface | Renderer and result |
| --- | --- |
| Lessons, guides, fenced/indented code, unknown languages | Web `MarkdownRenderer` delegates to `CodeBlock`; prose fallback colors also use the dark surface. |
| Algorithm solutions, Python companions, review snippets | Existing shared web/native `CodeBlock`; verified against surrounding light panels. |
| Mermaid source and error fallback | Shared `CodeBlock`; diagram graphics keep their own theme. |
| Playground editor/console | Existing dark Sandpack surfaces; explicit readable syntax colors replace inherited low-contrast comments, numbers, and booleans. |
| Playground initialization failure | Authored files now reuse `CodeBlock` instead of a separate light `pre`. |
| Native Markdown | Fenced and four-space-indented blocks share the dark style; the latter previously inherited the library's light default. |
| Quiz questions and feedback | Plain text, with no separate code-block renderer to theme. |
| Inline code | Keeps its contrasting prose chip on web and native. |

The Web playground regression reproduced 3.88:1 comments and 3.71:1 numeric/boolean literals before the explicit syntax palette. These text categories now meet the same 4.5:1 target as lesson code. Native Jest tests verify rendered props; the 2026-09-29 follow-up adds real simulator gesture and layout verification below.

## Scope

### In Scope

- Markdown browser
- track and difficulty filters
- fuzzy search
- embedded and external Mermaid rendering
- generated local content index
- optional Supabase sync scaffold

### Out Of Scope

- auth UI and progress storage, which are owned by `docs/features/auth-and-progress.md`
- AI summaries
- content editing in the app
- server-backed runtime search

### Assumptions

- Repo Markdown remains canonical after Supabase sync is enabled.
- V1 content targets senior/system-design-oriented engineers.

## Detailed Behavior

### UI / UX

- `/browse` shows the usable content library immediately and links to the discovery home and `/paths` catalog through shared navigation.
- `/` shows the game campaign; `/learn` shows the cross-section discovery hub; `/paths` shows the complete learning-path catalog.
- `/docs/[...slug]` renders one article with metadata, outline, Markdown body, and referenced diagrams.
- `/diagrams/[...slug]` renders one standalone Mermaid diagram.
- Article and diagram routes remain static-first. When opened from a path, a client wrapper reads `?path=` and shows the precomputed next-node link without making the server page dynamic.
- The layout is mobile-first and uses reusable wrapping dropdown filters with keyboard-friendly listbox behavior. The library has one set of search/track/difficulty/type controls; optional totals live in Library overview.
- Web articles limit prose width to about 768 px and place source/outline disclosures near the introduction. Article outline links remain keyboard accessible after expansion. Standalone diagrams retain their own scroll/renderer fallback. Shared ButtonLink supplies path continuation without changing progress payloads or static rendering.

### Data Model And Persistence

- Markdown lives under `content/knowledge/`.
- Diagrams live under `content/diagrams/`.
- The generated index stores metadata, Markdown, extracted plain text, headings, Mermaid blocks, learning paths, exercises, passive flashcard feeds, interview catalogs, source paths, and hashes.
- Native bundles the generated index for offline anonymous browsing, search, reading, and practice.
- Optional Supabase tables mirror the generated index for future hosted search.
- Articles and diagrams emit progress events for optional auth/progress. Their Markdown and Mermaid content still comes from the local index.

### Failure And Edge Handling

- Missing diagram refs fail index generation.
- Duplicate document slugs fail index generation.
- Invalid Mermaid renders an error state with source visible.

## Code Touchpoints

- `packages/core/src/content/schema.ts`: frontmatter and generated index types
- `packages/core/src/content/build-index.ts`: content and diagram indexing
- `packages/core/src/content/index.ts`: generated index access and path-node route helpers
- `packages/core/src/search.ts`: fuzzy ranking
- `packages/ui/src/screens.tsx`: native browse, reader, and diagram screens
- `apps/web/src/components/Dropdown.tsx`: reusable dropdown primitive for browser filters
- `apps/web/src/components/KnowledgeBrowser.tsx`: mobile-first browser and filter wiring
- `apps/web/src/components/CodeBlock.tsx`: shared highlighted code block renderer
- `apps/web/src/components/PathScopedNextLink.tsx`: path query reader for static article and diagram next-node links
- `apps/web/src/app/browse/page.tsx`: route that hosts the complete lesson and diagram browser
- `scripts/content/sync-supabase.ts`: optional Supabase upsert path

## App-wide reader design pass — 2026-10-03

Readers use a single reading column with optional outline and primary-source disclosures. Related diagrams and filters fit the available content width. Code, diagram and table scroll areas are named, keyboard-focusable groups with visible focus; inner groups avoid duplicate landmark names in feeds with repeated languages. The global local-progress notice follows page content in normal flow.

Test plan additions: rendering/navigation/source tests plus `design-foundations.regression.spec.ts` and `design-content.regression.spec.ts` cover keyboard scroll access, source links, overflow and axe checks at 200% text. Renderer failures retain source fallback. The route/platform audit tracks remaining device checks.

### Native diagram recovery

A bundled native diagram preview has a named WebView and a named HTML landmark. Diagram source is a disclosure during successful preview loading. If the WebView cannot load, source stays visible with Retry preview; retry remounts only the preview. Without a bundled renderer, source is visible directly. These states do not claim that Mermaid JavaScript rendering or an installed screen reader has been verified. Related article diagrams are plain sections with shared navigation actions.

Native `design-controls.test.tsx` exercises source disclosure, preview load failure and retry without losing source. Installed code/diagram scrolling remains a separate device gate.

## Test Plan

- Native Browse reuses Learn's local search hook and 300 ms typing pause. It announces “Searching…” and hides obsolete results, defers filter lookups during typing and shows the empty message only after settling. Input, query, ranking, content fields and the 40-result limit are unchanged. Native component regressions call the real shared search, pin the 299/300 ms boundary, replacement queries, selected difficulty, clearing and exact pending-timer cancellation on unmount. Run native coverage plus the Learn/Browse installed journeys after changing this shared hook.
- Installed `.maestro/browse-and-diagram.yaml` hides the search keyboard, waits for a settled numeric count, then scrolls the result title below its Diagram label fully into view before opening it. A tall card need not fit in one viewport. Run at normal and enlarged system text. Keep the result-list and destination-title assertions, the 20-second search bound and captured result for visual review.

- App-wide design pass: `CatalogSurfaces.test.tsx`, `SourceReferences.test.tsx`, `Button.test.tsx` and `NavigationAndRendering.test.tsx` preserve filtering, source URL/attribution/version, disclosure behavior, link semantics and path progress. `design-foundations.regression.spec.ts` adds axe/reflow at 320/768/1440 px, 200% text and keyboard outline navigation on all three browser projects. Run it with `E2E_PORT=3114 npx playwright test --config=apps/web/e2e/playwright.config.ts design-foundations.regression.spec.ts` plus existing reader/code/diagram journeys and both coverage gates. Coverage floors remain unchanged. Native reader visual/device checks remain pending in the app-wide audit.


- `WebPlayground.test.tsx` reproduces initialization failure and verifies shared source rendering and recovery. `code-styles.test.tsx` renders native fenced/indented/unknown-language Markdown plus standalone and inline code; the indented case failed before the fix.
- `code-contrast.regression.spec.ts` checks actual backgrounds and every rendered code text node in lessons, three algorithm languages, Python companions, passive review, SQL without highlighting, Mermaid source, and an edited playground containing comments, numbers, and booleans. Editor contrast is checked with the remote bundler blocked. Theme selection is intentionally absent.
- Run web/core and native coverage, lint, typecheck, production build, the contrast regression and smoke lane. Native installed-device checks complement local Jest assertions: `npm run mobile:e2e:code-layout -- --session <session>` measures real native rectangles before/after horizontal swipes and checks reverse and vertical scrolling. Run it on both Android and iOS; see `apps/mobile/e2e/README.md`. The EAS release lane also runs `.maestro/code-layout.yaml` and retains screenshots.
- Native renderer assertions cover plain, padded, empty, and whitespace-only fence metadata, language labels outside the scroll viewport, and uncapped height at the outer container, scroll viewport, content container, and source. Deliberately moving the language label into scrolling, adding an inner height cap, or removing language trimming must fail the targeted Jest suite.

- Unit: frontmatter validation, parsing, headings, Mermaid block extraction, code block rendering, fuzzy ranking, snippets.
- Integration: generated index loads starter content and validates external diagrams.
- E2E: a mobile user filters, searches, opens a document, and opens a diagram. Empty results explain that no lessons or diagrams match the filters; unavailable routes provide a link back to home.
- CSS regression: `code-contrast.regression.spec.ts` reads computed styles in the actual lesson at 390px and 1280px. It checks every rendered code text node against the surface (including the faint grid), preserves inline styling, and rejects page overflow. This test first reproduced 1.21:1 body-text contrast caused by the prose background override. A browser is the lowest reliable layer for this cascade defect; JSX-only tests cannot prove computed contrast.

### Local code-style verification — 2026-09-28

- Web/core coverage: 358 tests, with aggregate and per-file gates passing. Native coverage: 50 tests. Lint, workspace typecheck, and the production build pass.
- Browser validation: 19 contrast, playground, and smoke cases pass across the configured Chromium/WebKit projects; lesson contrast is measured at 390px and 1280px.
- Mobile Doctor passes 19/20 checks and reports ten existing Expo patch-version mismatches. Maestro is not installed locally; the updated screenshot step has not been run on Android/iOS. No dependency upgrade or native release readiness is claimed.

### Native scrolling follow-up — 2026-09-29

- Reproduced wrapped signatures/indentation in native Markdown. Fenced, indented, unlabeled, and unknown-language blocks now use the existing native `CodeBlock` instead of plain `Text` rules. The language label stays outside the horizontal viewport.
- Removed the shared 340px height cap, which could hide long interview/review/diagram source. The outer container remains bounded by its parent width; only source content can move horizontally. System text scaling remains enabled, and inline code retains its separate prose style.
- Jest checks nested list/quote code, whitespace and blank-line preservation, language metadata, long examples, and independent horizontal scroll props. `e2e/code-layout.mjs` checks actual source motion, unchanged prose/navigation/container bounds, reversal, and vertical scrolling from inside code. It saves screenshots and raw native trees on success and failure.
- The checked-in Maestro journey covers the real BFS lesson, swipes in both directions, and verifies following prose/navigation. Geometry assertions run in the local agent-device lane; Maestro screenshots require visual review. Simulator verification uses Expo Go and is not a signed release-artifact check.
- Mutation check: temporarily disabling horizontal scrolling makes the device runner fail at “A horizontal swipe must move the code source”; restoring it passes. Failure screenshots and native trees are retained.
- Validation: agent-device geometry checks pass on iPhone 17 (iOS 26.3) and the S24 Android emulator. Maestro 2.8.0 passes the same flow on both, using temporary Expo Go app/deep-link substitutions. Manual visual checks also cover iOS diagram source, the full Android Number Of Islands solution, enlarged iOS accessibility text, and Android 1.5× text; system settings were restored. Mobile coverage passes 59 tests; web/core coverage passes 358 tests; lint, workspace typecheck, content check, production build, and all nine browser smoke tests pass (smoke used port 3102 because another server owns 3100). Expo Doctor still reports the existing ten patch-version mismatches (19/20 checks); no dependency upgrade or EAS release-artifact validation is claimed.

### Review validation — 2026-09-30

- Merged `main` at `582ce78`, preserving the admin-navigation mock and checks. Its Expo alignment fixes bring Doctor to 20/20 passing checks.
- Strengthened Jest coverage after four deliberate mutations survived the original tests: a scrolling language label, an inner height cap, clamped tablet labels, and untrimmed language metadata. Each now fails its specific regression assertion; restored code passes.
- Current validation passes 71 native tests, 389 web/core tests and both coverage gates, lint, workspace typecheck, content check, production build, nine browser smoke tests, four browser code-contrast regressions, and production-only HTTP readiness. The native geometry runner passes again on iPhone 17 and S24, with before/after screenshots inspected. These Expo Go checks still do not validate final EAS artifacts.

## Open Questions

- Which hosted Supabase policies should public read use if browser search moves from local fuzzy search to hosted search?

## Decision Log

- `2026-09-29`: Reuse native `CodeBlock` for Markdown, constrain horizontal scrolling to code, remove vertical clipping, and add Jest plus native gesture/layout regressions.

- `2026-09-28`: Extend the audit to every code surface. Reuse the shared renderer for playground fallback source, align native indented Markdown and plain web fallbacks, and explicitly set readable playground syntax. User-selectable themes remain future work.
- `2026-09-28`: Scope prose fallback styling away from shared highlighted blocks so Markdown cannot override the dark syntax background. Add a browser contrast regression; no theme palette, content, native UI, or coverage gate changes.
- `2026-05-20`: Use Next.js App Router and a generated local content index.
- `2026-05-20`: Keep Markdown canonical and Supabase optional for V1 runtime.
- `2026-05-29`: Remove the exact/fuzzy search mode toggle; the app always uses fuzzy search.
- `2026-05-29`: Replace native filter selects with a reusable Radix-backed dropdown component.
- `2026-05-30`: Move the browser from `/` to `/browse` so `/` can become the learning path map.
- `2026-06-21`: Keep article and diagram routes static-first by moving path-scoped next-link selection to a small client wrapper.
- `2026-07-11`: Move generated index access and search into `@codematica/core` so web and native share the same content/search contract.
- `2026-07-22`: Add the lesson/diagram type filter and remove the 30-result presentation cap.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/markdown-knowledge-browser.md first. Compare the documented browser, content, search, and diagram contract against the current code, implement or audit remaining gaps, update docs and tests, and call out any doc/code mismatches explicitly.`

### Native search runtime

Browse uses the same [local execution contract as Learn](home-discovery.md#native-local-search-execution): the unchanged core matcher runs in an offline WebView, with the latest filters, owned request replies, a bounded pending state and Retry search. Canonical destinations, snippets, ranking and the 40-result cap are preserved. Prepared-row parity and real screen composition tests complement `.maestro/browse-and-diagram.yaml`; installed checks retain the existing readiness, exact title and destination assertions.
