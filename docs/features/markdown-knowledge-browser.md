# Markdown Knowledge Browser

## Snapshot

- Status: `shipped`
- Last updated: `2026-05-30`
- Owner thread: `n/a`
- Current state: The browser lives at `/browse` and reads a generated local index from repo-authored Markdown, Mermaid, path, and exercise files.
- Target outcome: Users can browse, search, read articles, and render diagrams on mobile without Supabase credentials.
- Code touchpoints:
  - `src/lib/content/`
  - `src/lib/search.ts`
  - `src/components/Dropdown.tsx`
  - `src/components/KnowledgeBrowser.tsx`
  - `src/app/docs/[...slug]/page.tsx`
  - `src/app/diagrams/[...slug]/page.tsx`
- Primary tests:
  - `src/components/Dropdown.test.tsx`
  - `src/lib/content/parse-markdown.test.ts`
  - `src/lib/search.test.ts`
  - `e2e/specs/knowledge-browser.smoke.spec.ts`

## One-Minute Brief

The V1 app is a searchable study browser. Content authors create plain Markdown files with validated frontmatter and optional Mermaid blocks. A script generates a local index used by the Next.js app for browsing, filters, fuzzy search, article routes, and diagram routes.

## Outcome / Contract

- The app must work locally without Supabase.
- Markdown frontmatter must be validated before the index is generated.
- Search must be fuzzy by default with no exact/fuzzy toggle in the UI.
- Fuzzy search must weight title, tags, and headings above body text.
- Track and difficulty filters use the reusable Radix-backed `Dropdown` component, not native select styling.
- Embedded Mermaid blocks and external diagram files must render with source/error states.
- `src/generated/content-index.json` must not be edited manually.

## Current State

The feature is implemented with a small starter content set. Supabase has an optional schema and sync script but is not used by the browser runtime.

## Scope

### In Scope

- Markdown browser
- track and difficulty filters
- fuzzy search
- embedded and external Mermaid rendering
- generated local content index
- optional Supabase sync scaffold

### Out Of Scope

- auth
- persisted progress
- AI summaries
- content editing in the app
- server-backed runtime search

### Assumptions

- Repo Markdown remains canonical after Supabase sync is enabled.
- V1 content targets senior/system-design-oriented engineers.

## Detailed Behavior

### UI / UX

- `/browse` shows the usable knowledge browser immediately.
- `/` shows the learning path map.
- `/docs/[...slug]` renders one article with metadata, outline, Markdown body, and referenced diagrams.
- `/diagrams/[...slug]` renders one standalone Mermaid diagram.
- The layout is mobile-first and uses compact controls, including reusable dropdown filters with keyboard-friendly listbox behavior.

### Data Model And Persistence

- Markdown lives under `content/knowledge/`.
- Diagrams live under `content/diagrams/`.
- The generated index stores metadata, Markdown, extracted plain text, headings, Mermaid blocks, learning paths, exercises, source paths, and hashes.
- Optional Supabase tables mirror the generated index for future hosted search.

### Failure And Edge Handling

- Missing diagram refs fail index generation.
- Duplicate document slugs fail index generation.
- Invalid Mermaid renders an error state with source visible.

## Code Touchpoints

- `src/lib/content/schema.ts`: frontmatter and generated index types
- `src/lib/content/build-index.ts`: content and diagram indexing
- `src/lib/search.ts`: fuzzy ranking
- `src/components/Dropdown.tsx`: reusable dropdown primitive for browser filters
- `src/components/KnowledgeBrowser.tsx`: mobile-first browser and filter wiring
- `src/app/browse/page.tsx`: route that hosts the browser now that `/` is path-first
- `scripts/content/sync-supabase.ts`: optional Supabase upsert path

## Test Plan

- Unit: frontmatter validation, parsing, headings, Mermaid block extraction, fuzzy ranking, snippets.
- Integration: generated index loads starter content and validates external diagrams.
- E2E: mobile user uses dropdown filters, searches, opens a document, and opens a diagram.

## Open Questions

- Which hosted Supabase policies should public read use once auth is introduced?
- Which progress events become durable when gamification begins?

## Decision Log

- `2026-05-20`: Use Next.js App Router and a generated local content index.
- `2026-05-20`: Keep Markdown canonical and Supabase optional for V1 runtime.
- `2026-05-29`: Remove the exact/fuzzy search mode toggle; the app always uses fuzzy search.
- `2026-05-29`: Replace native filter selects with a reusable Radix-backed dropdown component.
- `2026-05-30`: Move the browser from `/` to `/browse` so `/` can become the learning path map.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/markdown-knowledge-browser.md first. Compare the documented browser, content, search, and diagram contract against the current code, implement or audit remaining gaps, update docs and tests, and call out any doc/code mismatches explicitly.`
