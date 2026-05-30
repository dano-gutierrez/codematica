# Future Roadmap

## Snapshot

- Status: `proposed`
- Last updated: `2026-05-20`
- Owner thread: `n/a`
- Current state: Roadmap items are documented but not implemented.
- Target outcome: Later versions add AI study assistance, flashcards, visual system design practice, code challenges, auth, and native-ready APIs.
- Code touchpoints:
  - `docs/engineering-overview.md`
  - `AGENTS.md`
- Primary tests:
  - `n/a`

## One-Minute Brief

Codematica should grow from a knowledge browser into a gamified engineering study system. V1 establishes the content and browsing base. Later features should build on that base without breaking Markdown authoring.

## Outcome / Contract

- Roadmap work must preserve repo Markdown as the canonical authoring source until a later decision changes it.
- Auth and durable progress should be added before multi-device scoring matters.
- AI features should read from validated content/index data rather than scraping rendered pages.

## Planned Feature Areas

- AI summaries, article Q&A, and study prompts.
- Flashcards generated from approved content and editable by maintainers.
- System design blueprints with visual structure, likely React Flow for editing and Mermaid import/export.
- Mermaid authoring and diagram creation mode inside the app.
- Code snaps for multiple languages.
- Editable JS/TS coding challenges with compilation or execution sandboxing.
- Real-time score feedback in a gaming style.
- Auth, profiles, saved progress, streaks, achievements, and review queues.
- Native client migration path once web contracts stabilize.

## Test Plan

Each roadmap item needs its own feature doc and tests when implementation begins.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, and docs/features/future-roadmap.md first. Create or update a dedicated feature doc for the roadmap item being implemented, then add behavior and tests without making Supabase mandatory unless the feature requires durable state.`
