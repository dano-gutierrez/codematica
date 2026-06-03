# Future Roadmap

## Snapshot

- Status: `proposed`
- Last updated: `2026-06-02`
- Owner thread: `n/a`
- Current state: Learning paths, flashcards, cloze practice, questionnaires, code reviews, passive flashcard feeds, and interview walkthroughs have a local-first MVP; deeper gamification remains planned.
- Target outcome: Later versions add AI study assistance, broader quiz loops, visual system design practice, code challenges, auth, durable progress, and native-ready APIs.
- Code touchpoints:
  - `docs/engineering-overview.md`
  - `docs/features/learning-paths-and-practice.md`
- Primary tests:
  - `n/a`

## One-Minute Brief

Codematica should grow from a path-first engineering study system into a deeper gamified learning product. The current MVP adds local learning paths, interactive practice, passive review feeds, and interview walkthroughs. Later features should build on that base without breaking Markdown authoring.

## Outcome / Contract

- Roadmap work must preserve repo Markdown as the canonical authoring source for documents until a later decision changes it.
- Learning paths and exercises should remain local structured content until auth or hosted authoring justifies a backend contract.
- Auth and durable progress should be added before multi-device scoring matters.
- AI features should read from validated content/index data rather than scraping rendered pages.

## Planned Feature Areas

- AI summaries, article Q&A, and study prompts.
- More practice depth beyond the shipped flashcard, cloze, choice, ordering, matching, and code-review MVP: scenario drills, adaptive review queues, scored review choices, and code challenges.
- System design blueprints with visual structure, likely React Flow for editing and Mermaid import/export.
- Mermaid authoring and diagram creation mode inside the app.
- Code review upgrades: timer and score formula, persisted attempts, multiple findings per file, fix-option choices, richer PR diff views, and AI-assisted scenario generation.
- Code snaps for multiple languages.
- Editable JS/TS coding challenges with compilation or execution sandboxing.
- Real-time score feedback in a gaming style.
- Auth, profiles, saved progress, gated levels, streaks, achievements, leaderboards, and optional paywall boundaries.
- Native client migration path once web contracts stabilize.

## Test Plan

Each roadmap item needs its own feature doc and tests when implementation begins.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, and docs/features/future-roadmap.md first. Create or update a dedicated feature doc for the roadmap item being implemented, then add behavior and tests without making Supabase mandatory unless the feature requires durable state.`
