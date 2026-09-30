# @codematica/core

Shared runtime-safe Codematica domain logic for web and native apps.

This package provides:

- Generated content index access and content contracts
- Document/diagram search, cross-section discovery search, and curation resolution
- Practice logic and passive flashcard windowing
- Interview collection and `WebExerciseProject` contracts
- Japanese gojūon, IME, and example lookup
- Handwriting scoring and progress validation/display helpers

Node-only authoring and indexing helpers also live here for root scripts. Mobile bundles should import only runtime exports.

Runtime-safe language modules live under `src/languages/` and `src/language-writing/`. Language catalogs from `content/languages/` are indexed into schema version 8. Indexing validates nested phrase, stage, skill, audio, checkpoint, and character references. Do not hand-edit the generated file. `src/progress/mastery.ts` owns deterministic six-box scheduling and non-destructive snapshot merge (newest schedule plus maximum score/count); `src/progress/progression.ts` owns stage percentage and stamp eligibility. Existing completion progress remains a separate compatible contract.

## Editorial contracts

`@codematica/core/linkedin` exports shared schemas, manual-create RPCs and analysis gates, exact-revision approval checks, filtering and the Supabase RPC adapter; `@codematica/core/linkedin-store` owns race-aware review state for web/native. Neither module imports service credentials or the local worker. Private post data is fetched only after database-backed admin membership is checked. See `docs/features/linkedin-editorial.md`.

`@codematica/core/linkedin-formatting` provides shared Unicode selection formatting for the web and native post editors.
