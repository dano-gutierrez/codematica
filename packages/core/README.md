# @codematica/core

Shared runtime-safe Codematica domain logic for web and native apps.

This package owns generated content index access, content contracts, document/diagram search, cross-section discovery search and curation resolution, practice logic, passive flashcard windowing, interview collection and `WebExerciseProject` contracts, Japanese gojūon/IME/example lookup helpers, handwriting scoring, and progress validation/display helpers. Node-only authoring and indexing helpers live here for reuse by root scripts, but mobile bundles should import only runtime exports.

Runtime-safe language modules live under `src/languages/` and `src/language-writing/`. Local language catalogs are indexed from `content/languages/` into schema version 8; nested phrase, stage, skill, audio, checkpoint, and character references are validated and the generated file must not be hand-edited. `src/progress/mastery.ts` owns deterministic six-box scheduling and lossless state merge; `src/progress/progression.ts` owns stage percentage and stamp eligibility. Existing completion progress remains a separate compatible contract.
