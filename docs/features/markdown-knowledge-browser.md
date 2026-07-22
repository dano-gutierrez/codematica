# Markdown Knowledge Browser

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-22`
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
- `packages/core/src/generated/content-index.json` must not be edited manually.

## Current State

The feature is implemented with a growing local content set. The Mermaid authoring path exercises embedded rendering across 11 diagram families while retaining source and error states. Supabase has an optional schema and sync script but is not used by the browser runtime.

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
- `/` shows the learning path map.
- `/docs/[...slug]` renders one article with metadata, outline, Markdown body, and referenced diagrams.
- `/diagrams/[...slug]` renders one standalone Mermaid diagram.
- Article and diagram routes remain static-first. When opened from a path, a client wrapper reads `?path=` and shows the precomputed next-node link without making the server page dynamic.
- The layout is mobile-first and uses compact controls, including reusable dropdown filters with keyboard-friendly listbox behavior.

### Data Model And Persistence

- Markdown lives under `content/knowledge/`.
- Diagrams live under `content/diagrams/`.
- The generated index stores metadata, Markdown, extracted plain text, headings, Mermaid blocks, learning paths, exercises, passive flashcard feeds, interview catalogs, source paths, and hashes.
- Native bundles the generated index for offline anonymous browsing, search, reading, and practice.
- Optional Supabase tables mirror the generated index for future hosted search.
- Article and diagram progress events are emitted for the optional auth/progress layer, but Markdown and Mermaid content remain local-index sourced.

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
- `apps/web/src/app/browse/page.tsx`: route that hosts the browser now that `/` is path-first
- `scripts/content/sync-supabase.ts`: optional Supabase upsert path

## Test Plan

- Unit: frontmatter validation, parsing, headings, Mermaid block extraction, code block rendering, fuzzy ranking, snippets.
- Integration: generated index loads starter content and validates external diagrams.
- E2E: mobile user uses dropdown filters, searches, opens a document, and opens a diagram.

## Open Questions

- Which hosted Supabase policies should public read use if browser search moves from local fuzzy search to hosted search?

## Decision Log

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
