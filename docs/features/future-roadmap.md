# Future Roadmap

## Snapshot

- Status: `proposed`
- Last updated: `2026-09-29`
- Owner thread: `n/a`
- Current state: Learning paths, flashcards, cloze practice, questionnaires, passive flashcard feeds, interview walkthroughs, an Expo native foundation, and a bounded Japanese six-box review system have a local-first MVP. Restore the Signal adds a twelve-level campaign with CSS, SQL, data-flow, and system-design challenges; its installed-iOS and release gates remain open.
- Target outcome: Later versions add AI study assistance, broader quiz loops, visual system design practice, code challenges, deeper gamification, and native-ready APIs.
- Code touchpoints:
  - `docs/engineering-overview.md`
  - `docs/features/learning-paths-and-practice.md`
- Primary tests:
  - `n/a`

## One-Minute Brief

Codematica should grow from a path-first engineering study system into a deeper gamified learning product. The current app combines local study paths and practice with the [Restore the Signal campaign](restore-the-signal.md). Later features should build on these learning and game contracts without breaking Markdown authoring.

## Outcome / Contract

- Roadmap work must preserve repo Markdown as the canonical authoring source for documents until a later decision changes it.
- Learning paths and exercises should remain local structured content until hosted authoring justifies a backend contract.
- Basic Auth and resume progress exist. Japanese review and campaign awards have separate additive progress contracts. Future scoring and cross-domain review queues should preserve their privacy and merge principles without assuming one schedule fits every subject.
- AI features should read from validated content/index data rather than scraping rendered pages.

## Planned Feature Areas

- AI summaries, article Q&A, and study prompts.
- More practice depth beyond the shipped flashcard, cloze, choice, ordering, matching, writing, and Japanese deterministic-review MVP: adaptive cross-domain review queues and additional authored campaign chapters.
- System design blueprints with visual structure, likely React Flow for editing and Mermaid import/export.
- Mermaid authoring and diagram creation mode inside the app.
- Code snaps for multiple languages.
- Deterministic grading, authored tests, saved drafts, and broader challenge types on top of the shipped editable React/TypeScript Sandpack runtime.
- Further SQL topics beyond the campaign’s selection and join subset; expand the existing parser allowlist, disposable runtime, fixtures, and tests together.
- Additional campaigns and richer achievements beyond the implemented sequential levels, stars, XP, streaks, restoration, and cosmetics.
- Leaderboards, richer profiles, and optional paywall boundaries remain outside the initial campaign release.
- Native feature hardening on top of the Expo foundation: offline updates, mobile E2E, app-store packaging, and native-first study ergonomics.

## Test Plan

Each roadmap item needs its own feature doc and tests when implementation begins.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/engineering-overview.md, and docs/features/future-roadmap.md first. Create or update a dedicated feature doc for the roadmap item being implemented, then add behavior and tests without making Supabase mandatory unless the feature requires durable state.`
