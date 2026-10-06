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

`src/language-writing/practice.ts` builds focused character-pair and catalog-reading word sheets, three-round trace/copy/recall sequences, and unambiguous matching pairs. Matching uses these pure helpers. The notebook engine in `notebook.ts` extends them with 24-repetition schedules, stable cursors and local vector snapshots including per-notebook difficulty; older snapshots default to Easy. `shape.ts` compares whole characters independently of stroke order, with Easy/Balanced/Precise coverage tolerances and loop checks that retain missing-feature/scribble rejection.

`src/language-writing/index.ts` also owns shared cubic stroke rendering, dense-ink normalization, and beginner scoring. The legacy stroke-by-stroke helpers retain their compatibility contract; notebook shape grading instead allows order/direction changes and extra lifts while requiring major-feature coverage. Kana geometry is local and attributed to KanjiVG in the canonical catalogs and third-party notices.

Japanese writing notebooks use 24 whole-prompt repetitions per sheet and support curated/custom text of 1–5 published characters. Ink stays on the device; coarse completion/unlocks optionally sync. See `docs/features/japanese-writing-notebooks.md` for the implementation, persistence and validation contract.

`getNotebookCatalogPreview` returns up to five distinct authored Japanese prompts and their whole-prompt readings for both catalog clients. Notebook storage optionally reads/writes a device-level romaji display preference; this does not alter sheet definitions or progress snapshots.

## Restore the Signal

`src/game/` owns the schema-v12 campaign contract, pure game rules, seeded traffic, transient sessions, local CSS/SQL sandbox documents, shared animation sampling, rewards/streaks, and account-scoped merge. It imports no graphics engine. `content/game/` is canonical; regenerate the index after authored changes.

`src/game/miniatures.ts` defines shared full-body character frames and transforms for measured web/native scenes. It keeps layout and cosmetic placement deterministic without importing graphics libraries.

Game store claims are serialized across account changes. Deferred identity checks must verify the active generation before merging remote awards or choosing a save payload; keep the interrupted-load tests when changing synchronization.
`@codematica/core/linkedin-preparation` validates sparse verification against an immutable candidate and derives preparation labels. Overview/detail polling retains only selected history and discards stale responses during edits. Voice rules and held-draft overrides use authenticated RPCs; local reports never authorize approval.

`src/game/map-art.ts` owns the fifty-position art panel order and bounded, renderer-independent parallax offsets. It does not create campaign levels or alter progression. Native runs its offset helper as a Reanimated worklet; web samples the same rule on scroll frames.
