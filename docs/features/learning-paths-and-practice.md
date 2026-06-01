# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-05-30`
- Owner thread: `n/a`
- Current state: The home route is a path-first map backed by local path and exercise JSON indexed with Markdown documents.
- Target outcome: Users can follow role and skill paths, open documents or diagrams, and complete flashcard or cloze practice without auth or Supabase.
- Code touchpoints:
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/components/LearningPathMap.tsx`
  - `src/components/PracticeCard.tsx`
  - `src/app/practice/[...slug]/page.tsx`
- Primary tests:
  - `src/lib/content/build-index.test.ts`
  - `src/lib/content/index.test.ts`
  - `src/components/PracticeCard.test.tsx`
  - `e2e/specs/knowledge-browser.smoke.spec.ts`

## One-Minute Brief

Codematica now uses learning paths as the main study surface. Paths are inspired by career and skill paths, language-app progression maps, and older interactive programming courses, but this milestone stays local-first: documents remain Markdown, paths and exercises are structured JSON, and all content remains open.

## Outcome / Contract

- `/` shows a mobile-first path map, not the fuzzy browser.
- `/browse` preserves the existing knowledge browser, fuzzy search, track filter, and difficulty filter.
- `/paths/[slug]` renders one role or skill path with ordered unit nodes.
- `/practice/[...slug]` renders one flashcard or cloze prompt.
- Exercise content is manually authored in `content/exercises/**/*.json`; path content is authored in `content/learning-paths/*.json`.
- `src/generated/content-index.json` has `schemaVersion: 2` and includes `learningPaths` and `exercises`.
- Index generation fails on duplicate path or exercise slugs, missing node references, exercises pointing at missing documents, or cloze templates without exactly one `{{blank}}`.
- No node is locked, disabled, gated, paywalled, or persisted as complete in this milestone.

## Current State

The shipped content includes one skill path and one role path using the starter Markdown articles, external Mermaid diagram, flashcards, and cloze prompts. Supabase remains optional and does not store paths, exercises, progress, or gating state yet.

## Scope

### In Scope

- role and skill learning paths
- path-first home route
- path detail route
- flashcard reveal interaction
- cloze answer checking
- path-aware next link from practice pages

### Out Of Scope

- auth, profiles, and saved progress
- locked levels, hearts, streaks, achievements, leaderboards, review queues, and paywalls
- generated exercises or AI feedback
- Supabase migrations for paths or exercises
- coding sandboxes or compiled challenges

### Assumptions

- Paths and exercises are validated local content artifacts, not remote runtime data.
- Current tracks remain document-level filters and do not become the only path taxonomy.
- Role and skill paths use the same schema.

## Detailed Behavior

### UI / UX

- Home shows path cards with node previews and a prominent `/browse` link.
- Path nodes can be documents, diagrams, or exercises and are always navigable.
- Flashcards reveal answer and explanation after the user taps the reveal button.
- Cloze prompts compare trimmed, case-insensitive answers against `acceptedAnswers`.
- When practice is opened from a path, completing the prompt exposes the next node in that path order.

### Data Model And Persistence

- `content/learning-paths/*.json` stores path metadata and ordered unit nodes.
- `content/exercises/**/*.json` stores `flashcard` and `cloze` prompts.
- Generated fields include `id`, `route`, `sourcePath`, and `contentHash`.
- No user state is persisted.

### Failure And Edge Handling

- Invalid path or exercise JSON fails `npm run content:index` and `npm run content:check`.
- Missing routes use the shared not-found page.
- A practice page opened without `?path=` still works but does not show a path-scoped next node.

## Code Touchpoints

- `src/lib/content/schema.ts`: schemas and generated index types.
- `src/lib/content/build-index.ts`: path and exercise collection, validation, reference checks, and schema version 2 serialization.
- `src/lib/content/index.ts`: lookup helpers and path-node route helpers.
- `src/components/LearningPathMap.tsx`: home and path detail UI.
- `src/components/PracticeCard.tsx`: flashcard and cloze interactions.
- `src/app/browse/page.tsx`: legacy browser route.

## Test Plan

- Unit: path and exercise schema coverage, cloze validation, duplicate slug validation, missing reference validation.
- Integration: generated index loads starter paths and exercises, and path-scoped next routes resolve.
- Component: flashcard reveal and cloze answer checking.
- E2E: mobile path landing, document open from a path, practice flow, `/browse` fuzzy search, and Mermaid diagram rendering.

## Open Questions

- Which progress events become durable once auth exists?
- Which path nodes become gated, and what user state unlocks them?
- Which future quiz types should be introduced before coding challenges?

## Decision Log

- `2026-05-30`: Make `/` path-first and move the fuzzy browser to `/browse`.
- `2026-05-30`: Keep every node open; defer locks, paywalls, and persisted progress.
- `2026-05-30`: Author exercises as structured JSON instead of parsing them out of Markdown.
- `2026-05-30`: Ship only flashcard and cloze practice while documenting broader quiz types as future work.

## Documentation Updates

- `docs/README.md`: Adds this feature doc and new content authoring areas to the reading map.
- Nested READMEs: Adds `content/learning-paths/README.md` and `content/exercises/README.md`.
- `docs/engineering-overview.md`: Updates the content flow and route model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/learning-paths-and-practice.md first. Compare the documented path and practice contract against src/lib/content/schema.ts, src/lib/content/build-index.ts, src/components/LearningPathMap.tsx, and src/components/PracticeCard.tsx, then update tests and docs with any behavior changes.`
