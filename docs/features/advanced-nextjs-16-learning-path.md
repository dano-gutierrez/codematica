# Advanced Next.js 16 Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-02`
- Owner thread: `n/a`
- Current state: A published `advanced-nextjs-16` skill path ships with eight hard Next.js lessons, eight questionnaires, and a passive one-minute brief feed.
- Target outcome: Experienced Next.js engineers can study rendering, caching, `force-dynamic`, invalidation, production pain points, performance, and migration behavior for Next.js 16 without Supabase or remote services.
- Code touchpoints:
  - `content/knowledge/frontend/*.md`
  - `content/exercises/frontend/*.json`
  - `content/learning-paths/advanced-nextjs-16.json`
  - `content/flashcard-feeds/advanced-nextjs-16.json`
  - `packages/core/src/content/index.test.ts`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `apps/web/e2e/specs/advanced-nextjs-16.regression.spec.ts`

## One-Minute Brief

The Advanced Next.js 16 path is a hard front-end development track for people already shipping App Router apps. It turns the most painful production topics into searchable lessons, active questionnaires, and a vertical passive feed meant to replace low-value social scrolling with short, useful review cards.

The feature is content-only and local-first. It does not change the path UI, practice schema, passive feed schema, auth model, Supabase dependency, or progress persistence.

## Outcome / Contract

- The `advanced-nextjs-16` path is published at `/paths/advanced-nextjs-16`.
- The path category is `Front-End Development` and the path kind is `skill`.
- The path contains eight ordered document/questionnaire pairs.
- All lessons, exercises, and passive cards are hard-only: `senior` or `principal`.
- The searchable Markdown lessons live under `content/knowledge/frontend/`.
- Practice lives under `content/exercises/frontend/` and uses existing questionnaire question kinds.
- The passive one-minute brief feed lives at `/paths/advanced-nextjs-16/flashcards`.
- Next.js factual claims must stay anchored to official Next.js docs, official Next.js release notes, or npm registry version metadata.
- Version-sensitive migration guidance includes Node/TypeScript minimums, async request APIs, Turbopack build behavior, Proxy's Node.js-only runtime, Cache Components' Node.js requirement, parallel-route defaults, and image-default changes.
- The path explains `export const dynamic = 'force-dynamic';` as previous-model route segment config that forced request-time rendering and segment-wide no-store fetch behavior, while documenting that Cache Components makes it unnecessary for normal Next.js 16 apps.

## Current State

The shipped path includes:

- `nextjs-16-rendering-model`: App Router rendering, Server Components, SSR meanings, Suspense, streaming, and Partial Prerendering.
- `nextjs-16-force-dynamic`: previous-model `force-dynamic` behavior and the Next.js 16 Cache Components migration guidance.
- `nextjs-16-cache-components`: `cacheComponents`, `"use cache"`, `cacheLife`, `cacheTag`, cache keys, and explicit cache contracts.
- `nextjs-16-data-fetching-caching`: server `fetch`, ORM reads, memoization, persistent cache, `no-store`, and stale data risk.
- `nextjs-16-invalidation-mutations`: Server Actions, `updateTag`, `revalidateTag`, read-your-own-writes, webhooks, and tag design.
- `nextjs-16-painful-production-lessons`: async request APIs, static-to-dynamic surprises, client/server boundaries, secrets, and cache debugging.
- `nextjs-16-performance-architecture`: Turbopack, routing, prefetching, streaming, and cache-driven performance tradeoffs.
- `nextjs-16-migration-review`: v15 to v16 migration review, codemods, `proxy.ts`, Cache Components adoption, and rollout checks.

## Scope

### In Scope

- Local Markdown lessons.
- Local questionnaire exercises.
- Path-scoped passive one-minute brief cards.
- Generated content index validation and path-level E2E coverage.
- Official Next.js source anchors in each lesson.

### Out Of Scope

- New UI for brief feeds.
- Persisted scores, progress, streaks, hearts, locks, or mastery state.
- Supabase schema changes or hosted sync requirements.
- Runnable Next.js sandboxes or compiled code challenges.
- Broad front-end role path beyond this skill path.

### Assumptions

- Users already know Next.js App Router basics.
- Cache Components is the target Next.js 16 model for new guidance.
- The passive flashcard feed is the one-minute vertical-scroll brief surface.
- The repository's lockfile and `package.json` are the authority for the version under test. Do not copy a transient npm `latest` value into learning content; re-check official versioned documentation and release notes when dependencies change.

## Detailed Behavior

### UI / UX

- The path appears on the path home with the existing `LearningPathMap` UI.
- Each article is available through `/docs/[...slug]` and `/browse` search.
- Each questionnaire uses the existing one-question-at-a-time mobile flow.
- The passive feed shows one short production review card per mobile viewport. Optional latest-card resume state is owned by `docs/features/auth-and-progress.md`.

### Data Model And Persistence

- No schema changes are introduced.
- `packages/core/src/generated/content-index.json` includes the new documents, exercises, path, and passive feed after `npm run content:index`.
- The path, exercises, and feed remain local content artifacts.
- Auth/progress may persist resume/completion milestones. It does not persist practice answers, scores, or mastery state.

### Business Logic

- The path alternates document then questionnaire for each unit.
- The passive one-minute brief feed is path-scoped and is not included as an ordered path node.
- All questions test production judgment and use only existing questionnaire kinds: `choice`, `cloze`, `ordering`, and `matching`.
- New vertical-scroll learning paths should include a passive feed unless a feature doc explicitly scopes that out.

### Failure And Edge Handling

- Missing document, exercise, path, or source document references fail content indexing.
- Invalid questionnaire or passive feed structure fails content indexing through existing validation.
- A practice page opened without `?path=` still works, but next-node navigation only appears for path-scoped sessions.

## Code Touchpoints

- `content/knowledge/frontend/*.md`: canonical Next.js 16 lessons and official source anchors.
- `content/exercises/frontend/*.json`: hard questionnaires for each lesson.
- `content/learning-paths/advanced-nextjs-16.json`: ordered path units and nodes.
- `content/flashcard-feeds/advanced-nextjs-16.json`: passive mobile one-minute brief cards.
- `packages/core/src/generated/content-index.json`: generated artifact; regenerate, do not hand-edit.
- `apps/web/e2e/specs/advanced-nextjs-16.regression.spec.ts`: mobile path, search, questionnaire, and passive-feed coverage.

## Test Plan

- Unit/integration: generated index loads the path, documents, questionnaires, passive feed, hard-only difficulties, and next-node routes.
- E2E: mobile user opens the path, reads the `force-dynamic` lesson, searches `/browse` for `force-dynamic`, completes the deterministic hard questionnaire, and opens the passive feed.
- Content check: `npm run content:check` must pass after content/index/schema-sensitive changes.

## Open Questions

- Which scoring, mastery, and review-queue events should become durable after basic progress?
- Should a future code-runner feature add small Next.js review challenges for route and cache snippets?

## Decision Log

- `2026-06-18`: Ship Advanced Next.js 16 as a standalone skill path under `Front-End Development`.
- `2026-06-18`: Reuse passive flashcard feeds as the one-minute vertical brief surface instead of adding a new schema.
- `2026-06-18`: Keep the path hard-only with `senior` and `principal` difficulty content.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the docs hub.
- Nested READMEs: Updates path, exercise, and passive feed README guidance for Front-End Development and Next.js 16 content.
- `docs/engineering-overview.md`: Adds the shipped Advanced Next.js 16 path to the content model and testing summary.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/advanced-nextjs-16-learning-path.md first. Compare the documented Advanced Next.js 16 path contract against content/knowledge/frontend, content/exercises/frontend, content/learning-paths/advanced-nextjs-16.json, content/flashcard-feeds/advanced-nextjs-16.json, packages/core/src/content/index.test.ts, and apps/web/e2e/specs/advanced-nextjs-16.regression.spec.ts, then update tests and docs with any behavior changes.`
