# Future Roadmap

## Snapshot

- Status: `proposed`
- Last updated: `2026-06-21`
- Owner thread: `n/a`
- Current state: Learning paths, flashcards, cloze practice, questionnaires, passive flashcard feeds, interview walkthroughs, and an Expo native foundation have a local-first MVP; deeper gamification remains planned.
- Target outcome: Later versions add AI study assistance, broader quiz loops, visual system design practice, code challenges, deeper gamification, and native-ready APIs.
- Code touchpoints:
  - `docs/engineering-overview.md`
  - `docs/features/learning-paths-and-practice.md`
- Primary tests:
  - `n/a`

## One-Minute Brief

Codematica should grow from a path-first engineering study system into a deeper gamified learning product. The current MVP adds local learning paths, interactive practice, passive review feeds, and interview walkthroughs. Later features should build on that base without breaking Markdown authoring.

## Outcome / Contract

- Roadmap work must preserve repo Markdown as the canonical authoring source for documents until a later decision changes it.
- Learning paths and exercises should remain local structured content until hosted authoring justifies a backend contract.
- Basic Auth and resume progress exist; scoring, mastery, streaks, and review queues should build on that contract.
- AI features should read from validated content/index data rather than scraping rendered pages.

## Planned Feature Areas

- AI summaries, article Q&A, and study prompts.
- More practice depth beyond the shipped flashcard, cloze, choice, ordering, and matching MVP: scenario drills, adaptive review queues, code challenges, and SQL query practice.
- System design blueprints with visual structure, likely React Flow for editing and Mermaid import/export.
- Mermaid authoring and diagram creation mode inside the app.
- Code snaps for multiple languages.
- Deterministic grading, authored tests, saved drafts, and broader challenge types on top of the shipped editable React/TypeScript Sandpack runtime.
- SQL query practice with an in-app editor backed by deterministic demo data, read-only validation, expected result checks, and a dedicated feature contract before any executable SQL schema or UI is added.
- Real-time score feedback in a gaming style.
- Gated levels, streaks, achievements, leaderboards, richer profiles, durable scoring, and optional paywall boundaries.
- Native feature hardening on top of the Expo foundation: offline updates, mobile E2E, app-store packaging, and native-first study ergonomics.

## Test Plan

Each roadmap item needs its own feature doc and tests when implementation begins.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, and docs/features/future-roadmap.md first. Create or update a dedicated feature doc for the roadmap item being implemented, then add behavior and tests without making Supabase mandatory unless the feature requires durable state.`
